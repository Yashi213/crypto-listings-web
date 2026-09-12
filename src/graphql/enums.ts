import { registerEnumType } from '@nestjs/graphql';
import { ListingStatus, UserRole } from '@prisma/client';

registerEnumType(ListingStatus, {
  name: 'ListingStatus',
  description: 'Статус листинга',
  valuesMap: {
    UPCOMING: { description: 'Предстоящий листинг' },
    RECENT: { description: 'Недавний (уже состоявшийся) листинг' },
  },
});

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'Роль пользователя',
  valuesMap: {
    USER: { description: 'Обычный пользователь' },
    ADMIN: { description: 'Администратор' },
  },
});
