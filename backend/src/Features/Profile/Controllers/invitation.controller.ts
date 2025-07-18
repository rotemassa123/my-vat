import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InvitationService } from '../Services/invitation.service';
import { SendInvitationRequest, SendInvitationResponse } from '../Requests/invitation.requests';
import { RequireRoles } from 'src/Common/Infrastructure/decorators/require-roles.decorator';
import { UserType } from 'src/Common/consts/userType';

@ApiTags('invitations')
@Controller('invitations')
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @RequireRoles(UserType.admin, UserType.operator)
  @Post('send')
  async sendInvitations(@Body() request: SendInvitationRequest): Promise<SendInvitationResponse> {
    return await this.invitationService.sendInvitations(request);
  }
} 