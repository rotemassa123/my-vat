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
import { Response } from "express";
import { JwtService } from "@nestjs/jwt";
import { SignInRequest } from "src/Features/Auth/Requests/auth.requests";
import { AuthenticationGuard } from "src/Common/Infrastructure/guards/authentication.guard";
import { PasswordService } from "src/Common/ApplicationCore/Features/password.service";
import { IUserRepository } from "src/Common/ApplicationCore/Services/IUserRepository";
import { logger } from "src/Common/Infrastructure/Config/Logger";
import { UserType } from "src/Common/consts/userType";

interface UserResponse {
  userId: number;
  fullName: string;
  userType: UserType;
}

@ApiTags("auth")
@Controller("auth")
export class AuthenticationController {
  constructor(
    private jwtService: JwtService,
    private passwordService: PasswordService,
    private userService: IUserRepository
  ) {}

  @Post("/signIn")
  async signIn(
    @Body() request: SignInRequest,
    @Res({ passthrough: true }) response: Response
  ): Promise<UserResponse> {
    // Get user from database via user repository
    const user = await this.userService.findUserById(request.userId);

    if (!user) {
      logger.warn("User not found during authentication attempt", AuthenticationController.name, { userId: request.userId });
      throw new UnauthorizedException("Invalid credentials");
    }

    // Check password
    const isCorrectPassword = await this.passwordService.comparePassword(
      request.password,
      user.password
    );

    if (!isCorrectPassword) {
      logger.warn("Failed authentication attempt", AuthenticationController.name, { userId: request.userId });
      throw new UnauthorizedException("Invalid credentials");
    }

    // Create JWT payload (without password)
    const payload = {
      userId: user.userId,
      fullName: user.fullName,
      userType: user.userType,
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
      userId: user.userId,
      fullName: user.fullName,
      userType: user.userType,
    };
  }

  @UseGuards(AuthenticationGuard)
  @Get("/me")
  async getGuardProtected(
    @Req() request: Request
  ): Promise<UserResponse> {
    const jwt = request["jwt"];

    return {
      fullName: jwt.fullName,
      userId: jwt.userId,
      userType: jwt.userType,
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
