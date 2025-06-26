import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import {
  CreateUserRequest,
  UpdateUserRequest,
} from "../Requests/user.requests";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserModel } from "src/Common/API/REST/RestModels/user.models";
import { logger } from "src/Common/Infrastructure/Config/Logger";
import { UserEntity } from "src/Common/Infrastructure/DB/Entities/user.entity";
import { PasswordService } from "src/Common/ApplicationCore/Features/password.service";
import {
  ApiBody,
  ApiConsumes,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { UserIdDto } from "src/Common/API/REST/DTOs/DTOs";
import { FileInterceptor } from "@nestjs/platform-express";
import { AuthenticationGuard } from "src/Common/Infrastructure/guards/authentication.guard";
import { UserGuard } from "src/Common/Infrastructure/guards/user.guard";
import { InjectMapper } from "@automapper/nestjs";
import { Mapper } from "@automapper/core";

@ApiTags("registration")
@Controller("user")
@UseGuards(AuthenticationGuard, UserGuard)
export class UserController {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private passwordService: PasswordService,
    @InjectMapper() private _mapper: Mapper
  ) {}

  @Get()
  @ApiQuery({ name: "userId", required: true, type: String })
  async getUserByUserId(@Query() query: UserIdDto): Promise<UserModel> {
    logger.info(`get user [${query.userId}]`, UserController.name);
    
    const user = await this.userRepository.findOne({
      where: { userId: Number(query.userId) },
      relations: ["userType"],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${query.userId} not found`);
    }

    return this._mapper.map(user, UserEntity, UserModel);
  }

  @Post()
  async createUser(@Body() request: CreateUserRequest): Promise<string> {
    logger.info(`create user [${request.fullName}]`, UserController.name);
    
    // Check if user already exists
    const existingUser = await this.userRepository.findOneBy({
      userId: request.userId,
    });

    if (existingUser) {
      throw new ConflictException(
        `User with ID ${request.userId} already exists`
      );
    }

    // Hash password
    const hashedPassword = await this.passwordService.hashPassword(
      request.password
    );

    // Create user entity
    const userEntity = new UserEntity();
    userEntity.userId = request.userId;
    userEntity.fullName = request.fullName;
    userEntity.password = hashedPassword;
    // TODO: Handle userType mapping from enum to entity
    userEntity.profileImageUrl = "/user.png";

    await this.userRepository.save(userEntity);
    return userEntity.userId.toString();
  }

  @Delete(":userId")
  @ApiParam({ name: "userId", required: true, type: String })
  async deleteUser(@Param() param: UserIdDto): Promise<void> {
    logger.info(`delete user [${param.userId}]`, UserController.name);
    
    const result = await this.userRepository.delete({ userId: Number(param.userId) });

    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${param.userId} not found`);
    }
  }

  @Put(":userId")
  @ApiParam({ name: "userId", required: true, type: String })
  async updateUser(
    @Param() param: UserIdDto,
    @Body() request: UpdateUserRequest
  ): Promise<void> {
    logger.info(`updating user [${param.userId}]`, UserController.name);
    
    const result = await this.userRepository.update(
      { userId: Number(param.userId) }, 
      {
        fullName: request.fullName,
        profileImageUrl: request.profileImageUrl,
        // TODO: Handle userType mapping from enum to entity
      }
    );

    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${param.userId} not found`);
    }
  }

  @Post("profile-image")
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'number' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async uploadProfileImage(
      @Body() body: { userId: number },
      @UploadedFile() file: Express.Multer.File
  ): Promise<{ profileImageUrl: string }> {
    const { userId } = body;
    logger.info(
        `Uploading profile image for user [${userId}]`,
        UserController.name
    );

    // TODO: Implement file upload logic here
    // For now, return a placeholder
    const profileImageUrl = "/default-profile.png";

    // Update user's profile image URL
    await this.userRepository.update(
      { userId },
      { profileImageUrl }
    );

    return { profileImageUrl };
  }

  @Delete("profile-image/:userId")
  async deleteProfileImage(@Param("userId") userId: number): Promise<void> {
    logger.info(
      `Deleting profile image for user [${userId}]`,
      UserController.name
    );
    
    // Set profile image back to default
    await this.userRepository.update(
      { userId },
      { profileImageUrl: "/user.png" }
    );
  }
}
