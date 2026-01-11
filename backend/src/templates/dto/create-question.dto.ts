import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  text: string;

  @IsOptional()
  @IsString()
  codeSnippet?: string;

  @IsOptional()
  @IsString()
  codeLanguage?: string;

  @IsOptional()
  @IsString()
  difficulty?: string;

  @IsOptional()
  @IsString()
  expectedAnswer?: string;

  @IsOptional()
  @IsNumber()
  order?: number;
}
