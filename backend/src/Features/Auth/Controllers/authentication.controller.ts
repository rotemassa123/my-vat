import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
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
import { UserType } from "src/Common/consts/userType";
import { PublicEndpointGuard } from "src/Common/Infrastructure/decorators/publicEndpoint.decorator";

interface UserResponse {
  _id: string;
  fullName: string;
  userType: UserType;
  accountId: string;
  entityId: string;
}

@ApiTags("auth")
@Controller("auth")
export class AuthenticationController {
  constructor(
    private jwtService: JwtService,
    private passwordService: PasswordService,
    private userService: IProfileRepository,
    private googleOAuthService: IGoogleOAuthService
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
      throw new UnauthorizedException("Account is pending activation. Please check your email for an invitation link.");
    }

    // Additional security: Ensure user has a password set
    if (!user.hashedPassword) {
      logger.warn("Login attempt for user without password", AuthenticationController.name, { 
        email: normalizedEmail 
      });
      throw new UnauthorizedException("Account setup is not complete. Please use your invitation link to set up your account.");
    }

    const isCorrectPassword = await this.passwordService.comparePassword(
      request.password,
      user.hashedPassword
    );

    if (!isCorrectPassword) {
      logger.warn("Failed authentication attempt", AuthenticationController.name, { 
        email: normalizedEmail 
      });
      throw new UnauthorizedException("Invalid credentials");
    }

    await this.userService.updateUser(user._id, {
      last_login: new Date(),
    });

    // Create JWT payload (without password)
    const payload = {
      userId: user._id,
      fullName: user.fullName,
      userType: user.userType,
      accountId: user.accountId,
      entityId: user.entityId,
    };

    // Generate token
    const token = await this.jwtService.signAsync(payload);

    // Set cookie
    response.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });

    logger.info("Successful login", AuthenticationController.name, { 
      email: normalizedEmail,
      userId: user._id 
    });

    return {
      _id: user._id!,
      fullName: user.fullName,
      userType: user.userType,
      accountId: user.accountId,
      entityId: user.entityId,
    };
  }

  @UseGuards(AuthenticationGuard)
  @Get("/me")
  async getGuardProtected(
    @Req() request: Request
  ): Promise<UserResponse> {
    const user = (request as any).user;

    return {
      fullName: user.fullName,
      _id: user.userId,
      userType: user.userType,
      accountId: user.accountId,
      entityId: user.entityId,
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

      // Update last login and profile picture if needed
      const updateData: any = { last_login: new Date() };
      if (googleUserInfo.picture && googleUserInfo.picture !== user.profile_image_url) {
        updateData.profile_image_url = googleUserInfo.picture;
      }
      
      await this.userService.updateUser(user._id, updateData);

      // Create JWT payload
      const payload = {
        userId: user._id,
        fullName: user.fullName,
        userType: user.userType,
        accountId: user.accountId,
        entityId: user.entityId,
      };

      // Generate token
      const token = await this.jwtService.signAsync(payload);

      // Set cookie
      response.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
        path: "/",
      });

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
