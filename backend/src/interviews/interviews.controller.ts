import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';

@Controller('interviews')
@UseGuards(JwtAuthGuard)
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  // Interview endpoints
  @Post()
  createInterview(@Body() createInterviewDto: CreateInterviewDto, @Request() req: any) {
    return this.interviewsService.createInterview(req.user.sub, createInterviewDto);
  }

  @Get()
  getInterviews(@Request() req: any) {
    return this.interviewsService.getInterviewsByUser(req.user.sub);
  }

  @Get(':id')
  getInterview(@Param('id') id: string, @Request() req: any) {
    return this.interviewsService.getInterviewById(id, req.user.sub);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Request() req: any,
  ) {
    return this.interviewsService.updateInterviewStatus(id, req.user.sub, status);
  }

  @Put(':id/overall-notes')
  updateOverallNotes(
    @Param('id') id: string,
    @Body('overallNotes') overallNotes: string,
    @Request() req: any,
  ) {
    return this.interviewsService.updateOverallNotes(id, req.user.sub, overallNotes);
  }

  @Delete(':id')
  deleteInterview(@Param('id') id: string, @Request() req: any) {
    return this.interviewsService.deleteInterview(id, req.user.sub);
  }

  // Question navigation
  @Get(':interviewId/questions/:index')
  getQuestion(
    @Param('interviewId') interviewId: string,
    @Param('index') index: string,
    @Request() req: any,
  ) {
    return this.interviewsService.getInterviewQuestion(
      interviewId,
      req.user.sub,
      parseInt(index),
    );
  }

  @Put(':interviewId/questions/:questionId/skip')
  skipQuestion(
    @Param('questionId') questionId: string,
    @Request() req: any,
  ) {
    return this.interviewsService.skipQuestion(questionId, req.user.sub);
  }

  // Feedback endpoints
  @Post('questions/:questionId/feedback')
  saveFeedback(
    @Param('questionId') questionId: string,
    @Body() updateFeedbackDto: UpdateFeedbackDto,
    @Request() req: any,
  ) {
    return this.interviewsService.saveFeedback(questionId, req.user.sub, updateFeedbackDto);
  }

  @Get('questions/:questionId/feedback')
  getFeedback(@Param('questionId') questionId: string, @Request() req: any) {
    return this.interviewsService.getFeedback(questionId, req.user.sub);
  }

  @Delete('feedback/:feedbackId')
  deleteFeedback(@Param('feedbackId') feedbackId: string, @Request() req: any) {
    return this.interviewsService.deleteFeedback(feedbackId, req.user.sub);
  }

  @Get(':id/ai-summary')
  generateAISummary(@Param('id') id: string, @Request() req: any) {
    return this.interviewsService.generateAISummary(id, req.user.sub);
  }
}
