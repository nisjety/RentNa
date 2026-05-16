import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export interface IconProps {
  name: IoniconName;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 22, color }: IconProps) {
  return <Ionicons name={name} size={size} color={color} />;
}
