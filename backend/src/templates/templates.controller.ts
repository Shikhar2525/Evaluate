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
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { CreateQuestionDto } from './dto/create-question.dto';

@Controller('templates')
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  // Template endpoints
  @Post()
  createTemplate(@Body() createTemplateDto: CreateTemplateDto, @Request() req: any) {
    return this.templatesService.createTemplate(req.user.sub, createTemplateDto);
  }

  @Get()
  getTemplates(@Request() req: any) {
    return this.templatesService.getTemplatesByUser(req.user.sub);
  }

  @Get(':id')
  getTemplate(@Param('id') id: string, @Request() req: any) {
    return this.templatesService.getTemplateById(id, req.user.sub);
  }

  @Put(':id')
  updateTemplate(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
    @Request() req: any,
  ) {
    return this.templatesService.updateTemplate(id, req.user.sub, updateTemplateDto);
  }

  @Delete(':id')
  deleteTemplate(@Param('id') id: string, @Request() req: any) {
    return this.templatesService.deleteTemplate(id, req.user.sub);
  }

  // Section endpoints
  @Post(':templateId/sections')
  addSection(
    @Param('templateId') templateId: string,
    @Body() createSectionDto: CreateSectionDto,
    @Request() req: any,
  ) {
    return this.templatesService.addSection(templateId, req.user.sub, createSectionDto);
  }

  @Put('sections/:sectionId')
  updateSection(
    @Param('sectionId') sectionId: string,
    @Body() createSectionDto: CreateSectionDto,
    @Request() req: any,
  ) {
    return this.templatesService.updateSection(sectionId, req.user.sub, createSectionDto);
  }

  @Delete('sections/:sectionId')
  async deleteSection(@Param('sectionId') sectionId: string, @Request() req: any) {
    try {
      return await this.templatesService.deleteSection(sectionId, req.user.sub);
    } catch (error: any) {
      console.error('Controller delete section error:', error);
      throw error;
    }
  }

  // Question endpoints
  @Post('sections/:sectionId/questions')
  addQuestion(
    @Param('sectionId') sectionId: string,
    @Body() createQuestionDto: CreateQuestionDto,
    @Request() req: any,
  ) {
    return this.templatesService.addQuestion(sectionId, req.user.sub, createQuestionDto);
  }

  @Put('questions/:questionId')
  updateQuestion(
    @Param('questionId') questionId: string,
    @Body() createQuestionDto: CreateQuestionDto,
    @Request() req: any,
  ) {
    return this.templatesService.updateQuestion(questionId, req.user.sub, createQuestionDto);
  }

  @Delete('questions/:questionId')
  async deleteQuestion(@Param('questionId') questionId: string, @Request() req: any) {
    try {
      return await this.templatesService.deleteQuestion(questionId, req.user.sub);
    } catch (error: any) {
      console.error('Controller delete question error:', error);
      throw error;
    }
  }
}
