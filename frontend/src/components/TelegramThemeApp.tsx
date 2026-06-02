import React, { type ReactNode } from "react";
import { useTelegram } from "../hooks/useTelegram";

interface TelegramThemeAppProps {
  children: (colorScheme: "light" | "dark") => ReactNode;
}

export const TelegramThemeApp: React.FC<TelegramThemeAppProps> = ({
  children,
}) => {
  const { colorScheme, isLoading } = useTelegram();

  // Пока загружается Telegram, используем тёмную тему по умолчанию
  const currentColorScheme = isLoading ? "dark" : colorScheme;

  return <>{children(currentColorScheme)}</>;
};
