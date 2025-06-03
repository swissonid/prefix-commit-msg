import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/cli.ts'],
  dts: true,
  platform: 'node',
})
