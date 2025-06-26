import { Transform } from "class-transformer";
import {
  ArrayNotEmpty,
  IsArray,
  IsNumberString,
  Length,
  Min,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";

@ValidatorConstraint({ name: "IsNineDigitUserId", async: false })
export class IsNineDigitUserId implements ValidatorConstraintInterface {
  validate(value: number, args: ValidationArguments): boolean {
    return value.toString().length === 9;
  }

  defaultMessage(args: ValidationArguments): string {
    return `Each userId must be exactly 9 digits long`;
  }
}

export class UserIdDto {
  @IsNumberString({}, { message: "userId must be a numeric string" })
  @Length(9, 9, { message: "userId must be exactly 9 digits long" })
  userId: string;
}

export class UserIdsDto {
  @Transform(({ value }) =>
    typeof value === "string"
      ? value.split(",").map((id: string) => parseInt(id.trim(), 10))
      : value
  )
  @IsArray({ message: "userIds must be an array of numbers" })
  @ArrayNotEmpty({ message: "userIds array cannot be empty" })
  @Validate(IsNineDigitUserId, {
    each: true,
    message: "Each userId must be exactly 9 digits long",
  })
  @Min(0, {
    each: true,
    message: "Each userId must be a non-negative number",
  })
  userIds: number[];
}
export class ProjectIdDto {
  @IsNumberString({}, { message: "projectId must be a numeric string" })
  projectId: number;
}

export class StepIdDto {
  @IsNumberString({}, { message: "stepId must be a numeric string" })
  stepId: string;
}
