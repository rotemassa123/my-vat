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
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SignInRequest } from "src/Features/Auth/Requests/auth.requests";
import { AuthenticationGuard } from "src/Common/Infrastructure/guards/authentication.guard";
import { UserEntity } from "src/Common/Infrastructure/DB/Entities/user.entity";
import { PasswordService } from "src/Common/ApplicationCore/Features/password.service";
import { logger } from "src/Common/Infrastructure/Config/Logger";

@ApiTags("auth")
@Controller("auth")
export class AuthenticationController {
  constructor(
    private jwtService: JwtService,
    private passwordService: PasswordService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>
  ) {}

  @Post("/signIn")
  async signIn(
    @Body() request: SignInRequest,
    @Res({ passthrough: true }) response: Response
  ): Promise<UserEntity> {
    // Get user from database
    const user = await this.userRepository.findOne({
      where: { userId: request.userId },
      relations: ["userType"],
    });

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
      ...user,
    };
    delete payload.password;

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

    return user;
  }

  @UseGuards(AuthenticationGuard)
  @Get("/me")
  async getGuardProtected(
    @Req() request: Request
  ): Promise<Omit<UserEntity, "password" | "projects">> {
    const jwt = request["jwt"];

    const user: Omit<UserEntity, "password" | "projects"> = {
      fullName: jwt.fullName,
      userId: jwt.userId,
      profileImageUrl: jwt.profileImageUrl,
      userType: jwt.userType,
    };

    return user;
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
