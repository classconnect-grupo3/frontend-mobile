import { createTamagui } from 'tamagui'
import { config as defaultConfig } from '@tamagui/config'

const config = createTamagui({
    ...defaultConfig,

    // Optional: define your own themes or extend the default ones
    themes: {
        ...defaultConfig.themes,
        myTheme: {
            background: '#fff',
            color: '#111',
            accent: '$indigo9',
            borderColor: '#ccc',
            // define more tokens if needed
        },
        },
})

export type AppConfig = typeof config
declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config
