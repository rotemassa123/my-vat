import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Param,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { JwtService } from "@nestjs/jwt";
import { SignInRequest } from "src/Features/Auth/Requests/auth.requests";
import { AuthenticationGuard } from "src/Common/Infrastructure/guards/authentication.guard";
import { PasswordService } from "src/Common/ApplicationCore/Features/password.service";
import { IProfileRepository } from "src/Common/ApplicationCore/Services/IProfileRepository";
import { IGoogleOAuthService } from "src/Common/ApplicationCore/Services/IGoogleOAuthService";
import { logger } from "src/Common/Infrastructure/Config/Logger";
import { UserRole } from "src/Common/consts/userRole";
import { PublicEndpointGuard } from "src/Common/Infrastructure/decorators/publicEndpoint.decorator";
import * as httpContext from 'express-http-context';
import { UserContext } from "src/Common/Infrastructure/types/user-context.type";
import { RequireRoles } from "src/Common/Infrastructure/decorators/require-roles.decorator";
import {
  AuthenticationService,
  ImpersonationTokenPayload,
} from "../Services/authentication.service";

interface UserResponse {
  _id: string;
  fullName?: string;
  email: string;
  userType: UserRole;
  accountId: string;
  entityId: string;
  profile_image_url?: string;
}

@ApiTags("auth")
@Controller("auth")
export class AuthenticationController {
  constructor(
    private jwtService: JwtService,
    private passwordService: PasswordService,
    private userService: IProfileRepository,
    private googleOAuthService: IGoogleOAuthService,
    private authenticationService: AuthenticationService,
  ) {}

  @PublicEndpointGuard()
  @Post("/login")
  async signIn(
    @Body() request: SignInRequest,
    @Res({ passthrough: true }) response: Response
  ): Promise<UserResponse> {
    // Normalize and validate email format
    const normalizedEmail = request.email.toLowerCase().trim();
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      logger.warn("Invalid email format during login attempt", AuthenticationController.name, { 
        email: request.email 
      });
      throw new UnauthorizedException("Invalid credentials");
    }

    const user = await this.userService.findUserByEmail(normalizedEmail);

    if (!user) {
      logger.warn("User not found during authentication attempt", AuthenticationController.name, { 
        email: normalizedEmail 
      });
      throw new UnauthorizedException("Invalid credentials");
    }

    // Ensure the email matches exactly (prevent email tampering)
    if (user.email.toLowerCase() !== normalizedEmail) {
      logger.warn("Email mismatch during login attempt", AuthenticationController.name, { 
        userEmail: user.email, 
        requestEmail: normalizedEmail 
      });
      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.status === 'pending' || user.status === 'failed to send request') {
      logger.warn("Login attempt for pending/failed user", AuthenticationController.name, { 
        email: normalizedEmail, 
        status: user.status 
      });
      throw new UnauthorizedException("User is pending activation. Please check your email for an invitation link.");
    }

    // Additional security: Ensure user has a password set
    if (!user.hashed_password) {
      logger.warn("Login attempt for user without password", AuthenticationController.name, { 
        email: normalizedEmail 
      });
      throw new UnauthorizedException("Account setup is not complete. Please use your invitation link to set up your account.");
    }

    const isCorrectPassword = await this.passwordService.comparePassword(
      request.password,
      user.hashed_password
    );

    if (!isCorrectPassword) {
      logger.warn("Failed authentication attempt", AuthenticationController.name, { 
        email: normalizedEmail 
      });
      throw new UnauthorizedException("Invalid credentials");
    }

    await this.userService.updateUser(user._id, {
      last_login_at: new Date(),
    });

    // Create JWT payload (without password)
    const payload = {
      userId: user._id,
      fullName: user.full_name,
      email: user.email,
      userType: user.role,
      // For operators, explicitly exclude accountId and entityId
      // For other user types, include them as they are
      ...(user.role !== UserRole.OPERATOR && {
        accountId: user.accountId,
        entityId: user.entityId,
      }),
      profile_image_url: user.profile_image_url,
    };

    // Generate token
    const token = await this.jwtService.signAsync(payload);

    // Set cookie
    this.authenticationService.setAuthCookie(response, token);

    logger.info("Successful login", AuthenticationController.name, { 
      email: normalizedEmail,
      userId: user._id 
    });

    return {
      _id: user._id!,
      fullName: user.full_name,
      email: user.email,
      userType: user.role,
      accountId: user.accountId,
      entityId: user.entityId,
      profile_image_url: user.profile_image_url,
    };
  }

  @UseGuards(AuthenticationGuard)
  @RequireRoles(UserRole.OPERATOR)
  @Post("/magic-links")
  async createImpersonationLink(
    @Body("userId") userId: string,
  ): Promise<{ token: string; expiresAt: string; impersonationUrl: string }> {
    if (!userId) {
      throw new BadRequestException("userId is required");
    }

    const targetUser = await this.userService.findUserById(userId);
    if (!targetUser?._id) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const operatorContext = httpContext.get('user_context') as UserContext | undefined;
    const operatorId = operatorContext?.userId ?? 'unknown';

    const { token, expiresAt, impersonationUrl } =
      await this.authenticationService.createImpersonationToken(
        targetUser._id,
        operatorId,
      );

    logger.info("Generated impersonation link", AuthenticationController.name, {
      operatorId,
      targetUserId: targetUser._id,
      expiresAt: expiresAt.toISOString(),
    });

    return {
      token,
      expiresAt: expiresAt.toISOString(),
      impersonationUrl,
    };
  }

  @UseGuards(AuthenticationGuard)
  @Get("/me")
  async getGuardProtected(
    @Req() request: Request
  ): Promise<UserResponse> {
    // Get user context from httpContext
    const userContext = httpContext.get('user_context') as UserContext | undefined;
    
    if (!userContext?.userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Fetch full user data from repository
    const user = await this.userService.findUserById(userContext.userId);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      fullName: user.full_name,
      email: user.email,
      _id: user._id!,
      userType: user.role,
      accountId: user.accountId,
      entityId: user.entityId,
      profile_image_url: user.profile_image_url,
    };
  }

  @Post("/logout")
  @UseGuards(AuthenticationGuard)
  async logout(
    @Res({ passthrough: true }) response: Response
  ): Promise<{ success: boolean }> {
    response.clearCookie("auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return { success: true };
  }

  @PublicEndpointGuard()
  @Get("/magic-link/:token")
  async redeemImpersonationToken(
    @Param("token") token: string,
    @Res() response: Response,
  ): Promise<void> {
    const frontendUrl = this.authenticationService.getFrontendBaseUrl();

    try {
      const payload = await this.authenticationService.verifyImpersonationToken(
        token,
      );

      const targetUser = await this.userService.findUserById(payload.sub);
      if (!targetUser?._id) {
        throw new UnauthorizedException("User not found");
      }

      await this.userService.updateUser(targetUser._id, { last_login_at: new Date() });

      const sessionPayload = {
        userId: targetUser._id,
        fullName: targetUser.full_name,
        email: targetUser.email,
        userType: targetUser.role,
        // For operators, explicitly exclude accountId and entityId
        // For other user types, include them as they are
        ...(targetUser.role !== UserRole.OPERATOR && {
          accountId: targetUser.accountId,
          entityId: targetUser.entityId,
        }),
        profile_image_url: targetUser.profile_image_url,
        impersonatedBy: payload.operatorId,
      };

      const sessionToken = await this.jwtService.signAsync(sessionPayload);
      this.authenticationService.setAuthCookie(response, sessionToken);

      logger.info("Impersonation token redeemed", AuthenticationController.name, {
        operatorId: payload.operatorId,
        targetUserId: targetUser._id,
      });

      response.redirect(`${frontendUrl}/dashboard?impersonated=1`);
      return;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.warn("Failed to redeem impersonation token", AuthenticationController.name, {
        error: errorMessage,
        stack: errorStack,
      });

      response.clearCookie("auth_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });

      response.redirect(`${frontendUrl}/login?error=impersonation_invalid`);
      return;
    }
  }

  @PublicEndpointGuard()
  @Get("/google")
  async googleAuth(@Res() response: Response): Promise<void> {
    const authUrl = this.googleOAuthService.getAuthUrl();
    logger.info("Initiating Google OAuth", AuthenticationController.name, { authUrl });
    response.redirect(authUrl);
  }

  @PublicEndpointGuard()
  @Get("/google/callback")
  async googleCallback(
    @Req() request: Request,
    @Res() response: Response
  ): Promise<void> {
    try {
      const { code, error } = request.query;

      if (error) {
        logger.warn("Google OAuth error", AuthenticationController.name, { error });
        response.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed`);
        return;
      }

      if (!code) {
        logger.warn("No authorization code received from Google", AuthenticationController.name);
        response.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=no_code`);
        return;
      }

      const googleUserInfo = await this.googleOAuthService.verifyAuthCode(code as string);

      // Check if user exists by email
      let user = await this.userService.findUserByEmail(googleUserInfo.email);
      
      if (!user) {
        logger.info("Google OAuth user not found, user needs to be invited first", AuthenticationController.name, { 
          email: googleUserInfo.email 
        });
        response.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=user_not_found`);
        return;
      }

      if (user.status === 'pending' || user.status === 'failed to send request') {
        logger.warn("Google OAuth login attempt for pending/failed user", AuthenticationController.name, { 
          email: googleUserInfo.email, 
          status: user.status 
        });
        response.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=account_pending`);
        return;
      }

      // Update last login time
      await this.userService.updateUser(user._id, { last_login_at: new Date() });

      // Create JWT payload
      const payload = {
        userId: user._id,
        fullName: user.full_name,
        email: user.email,
        userType: user.role,
        // For operators, explicitly exclude accountId and entityId
        // For other user types, include them as they are
        ...(user.role !== UserRole.OPERATOR && {
          accountId: user.accountId,
          entityId: user.entityId,
        }),
        profile_image_url: user.profile_image_url,
      };

      // Generate token
      const token = await this.jwtService.signAsync(payload);

      // Set cookie
      this.authenticationService.setAuthCookie(response, token);

      logger.info("Google OAuth login successful", AuthenticationController.name, { 
        email: googleUserInfo.email,
        userId: user._id 
      });

      // Redirect to frontend with success
      response.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?login=success`);

    } catch (error) {
      logger.error("Google OAuth callback error", AuthenticationController.name, { 
        error: error.message 
      });
      response.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_error`);
    }
  }
}
