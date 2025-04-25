import { createTamagui } from 'tamagui'
import { config as defaultTheme } from '@tamagui/config'

const config = createTamagui({
  ...defaultTheme,
})

export type AppConfig = typeof config
declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config
