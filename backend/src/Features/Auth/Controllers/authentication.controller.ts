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
import { logger } from "src/Common/Infrastructure/Config/Logger";
import { UserType } from "src/Common/consts/userType";
import { PublicEndpointGuard } from "src/Common/Infrastructure/decorators/publicEndpoint.decorator";

interface UserResponse {
  _id: string;
  fullName: string;
  userType: UserType;
  accountId: string;
}

@ApiTags("auth")
@Controller("auth")
export class AuthenticationController {
  constructor(
    private jwtService: JwtService,
    private passwordService: PasswordService,
    private userService: IProfileRepository
  ) {}

  @PublicEndpointGuard()
  @Post("/login")
  async signIn(
    @Body() request: SignInRequest,
    @Res({ passthrough: true }) response: Response
  ): Promise<UserResponse> {
    const user = await this.userService.findUserByEmail(request.email);

    if (!user) {
      logger.warn("User not found during authentication attempt", AuthenticationController.name, { email: request.email });
      throw new UnauthorizedException("Invalid credentials");
    }

    // Check password
    const isCorrectPassword = await this.passwordService.comparePassword(
      request.password,
      user.hashedPassword
    );

    if (!isCorrectPassword) {
      logger.warn("Failed authentication attempt", AuthenticationController.name, { email: request.email });
      throw new UnauthorizedException("Invalid credentials");
    }

    // Create JWT payload (without password)
    const payload = {
      userId: user._id,
      fullName: user.fullName,
      userType: user.userType,
      accountId: user.accountId,
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

    return {
      _id: user._id!,
      fullName: user.fullName,
      userType: user.userType,
      accountId: user.accountId,
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
}
