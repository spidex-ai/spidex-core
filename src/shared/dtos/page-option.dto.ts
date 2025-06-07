import { SortOrder } from '@constants/pagination.constant';
import { ApiProperty } from '@nestjs/swagger';

import { EnumFieldOptional, NumberFieldOption, StringFieldOption } from '@shared/decorators/field.decorator';

export class PageOptionsDto<TOrderBy = string> {
  @StringFieldOption()
  @ApiProperty({
    default: 'createdAt',
  })
  readonly orderBy: TOrderBy;

  @ApiProperty({
    default: SortOrder.ASC,
  })
  @EnumFieldOptional(() => SortOrder, {
    default: SortOrder.ASC,
  })
  readonly direction: SortOrder = SortOrder.ASC;

  @ApiProperty({
    default: 1,
  })
  @NumberFieldOption({
    minimum: 1,
    default: 1,
    int: true,
  })
  readonly page: number = 1;

  @ApiProperty({
    default: 10,
  })
  @NumberFieldOption({
    minimum: 1,
    default: 10,
    int: true,
  })
  readonly limit: number = 10;

  constructor(page?: number, limit?: number, orderBy?: TOrderBy, direction?: SortOrder) {
    this.page = page ?? 1;
    this.limit = limit ?? 10;
    this.orderBy = orderBy ?? ('createdAt' as TOrderBy);
    this.direction = direction ?? SortOrder.ASC;
  }
}
