import { IsString, IsOptional, IsArray, IsUUID } from 'class-validator';

export class CreateInterviewDto {
  @IsString()
  templateId: string;

  @IsOptional()
  @IsString()
  candidateName?: string;

  @IsOptional()
  @IsArray()
  questions?: Array<{ questionId: string }>;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  sectionOrder?: string[];
}
