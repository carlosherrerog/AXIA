import React, { createContext, useContext } from 'react';
import { darkColors } from '../themes/styles';

const ThemeContext = createContext({ colors: darkColors });

export function ThemeProvider({ children }) {
  return (
    <ThemeContext.Provider value={{ colors: darkColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
