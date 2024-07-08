/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables
import { createVuetify } from 'vuetify'

/*
  defaultテーマは下記で取得可能
  import { useTheme } from 'vuetify'
  onMounted(() => {
    const theme = useTheme();
    console.log(theme.global)
  })
*/

const themes = {
  light: {
    dark: false,
    colors: {
      "background": "#FFFFFF",
      "surface": "#FFFFFF",
      "surface-bright": "#FFFFFF",
      "surface-light": "#EEEEEE",
      "surface-variant": "#424242",
      "surface-select": "#CCCCCC", //+
      "on-surface-variant": "#EEEEEE",
      "primary": "#1867C0",
      "primary-darken-1": "#1F5592",
      "secondary": "#48A9A6",
      "secondary-darken-1": "#018786",
      "error": "#B00020",
      "info": "#2196F3",
      "success": "#4CAF50",
      "warning": "#FB8C00",
      "on-background": "#000",
      "on-surface": "#000",
      "on-surface-bright": "#000",
      "on-surface-light": "#000",
      "on-primary": "#fff",
      "on-primary-darken-1": "#fff",
      "on-secondary": "#fff",
      "on-secondary-darken-1": "#fff",
      "on-error": "#fff",
      "on-info": "#fff",
      "on-success": "#fff",
      "on-warning": "#fff"
    }
  },
  dark: {
    dark: false,
    colors: {
      "background": "#121212",
      "surface": "#212121",
      "surface-bright": "#ccbfd6",
      "surface-light": "#424242",
      "surface-variant": "#a3a3a3",
      "surface-select": "#424242",//+
      "on-surface-variant": "#424242",
      "primary": "#2196F3",
      "primary-darken-1": "#277CC1",
      "secondary": "#54B6B2",
      "secondary-darken-1": "#48A9A6",
      "error": "#CF6679",
      "info": "#2196F3",
      "success": "#4CAF50",
      "warning": "#FB8C00",
      "on-background": "#fff",
      "on-surface": "#fff",
      "on-surface-bright": "#000",
      "on-surface-light": "#fff",
      "on-primary": "#fff",
      "on-primary-darken-1": "#fff",
      "on-secondary": "#fff",
      "on-secondary-darken-1": "#fff",
      "on-error": "#fff",
      "on-info": "#fff",
      "on-success": "#fff",
      "on-warning": "#fff"
    }
  },
  defaultLight: {
    dark: false,
    colors: {
      "background": "#FFFFFF",
      "surface": "#FFFFFF",
      "surface-bright": "#FFFFFF",
      "surface-light": "#EEEEEE",
      "surface-variant": "#424242",
      "on-surface-variant": "#EEEEEE",
      "primary": "#1867C0",
      "primary-darken-1": "#1F5592",
      "secondary": "#48A9A6",
      "secondary-darken-1": "#018786",
      "error": "#B00020",
      "info": "#2196F3",
      "success": "#4CAF50",
      "warning": "#FB8C00",
      "on-background": "#000",
      "on-surface": "#000",
      "on-surface-bright": "#000",
      "on-surface-light": "#000",
      "on-primary": "#fff",
      "on-primary-darken-1": "#fff",
      "on-secondary": "#fff",
      "on-secondary-darken-1": "#fff",
      "on-error": "#fff",
      "on-info": "#fff",
      "on-success": "#fff",
      "on-warning": "#fff"
    }
  },
  defaultDark: {
    dark: false,
    colors: {
      "background": "#121212",
      "surface": "#212121",
      "surface-bright": "#ccbfd6",
      "surface-light": "#424242",
      "surface-variant": "#a3a3a3",
      "on-surface-variant": "#424242",
      "primary": "#2196F3",
      "primary-darken-1": "#277CC1",
      "secondary": "#54B6B2",
      "secondary-darken-1": "#48A9A6",
      "error": "#CF6679",
      "info": "#2196F3",
      "success": "#4CAF50",
      "warning": "#FB8C00",
      "on-background": "#fff",
      "on-surface": "#fff",
      "on-surface-bright": "#000",
      "on-surface-light": "#fff",
      "on-primary": "#fff",
      "on-primary-darken-1": "#fff",
      "on-secondary": "#fff",
      "on-secondary-darken-1": "#fff",
      "on-error": "#fff",
      "on-info": "#fff",
      "on-success": "#fff",
      "on-warning": "#fff"
    }
  },
}
// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'dark',
    themes: themes
  },
  icons: {
    defaultSet: 'mdi',
    aliases: {
      delete: 'mdi-delete',
      cancel: 'mdi-close',
    },
  }
})
