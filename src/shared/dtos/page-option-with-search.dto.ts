import { StringFieldOption } from '@shared/decorators/field.decorator';
import { PageOptionsDto } from './page-option.dto';

export class PageOptionsWithSearchDto<TOrderBy = string> extends PageOptionsDto<TOrderBy> {
  @StringFieldOption()
  keyword: string;
}
