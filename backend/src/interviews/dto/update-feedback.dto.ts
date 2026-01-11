import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export class UpdateFeedbackDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;
}
