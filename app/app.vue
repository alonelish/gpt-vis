<script setup>
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

const title = 'GPT Visualizer'
const description = 'Ask questions about your CSV data and get answers with charts. Upload a CSV, type a question, and see text answers plus bar, line, pie, and histogram visualizations.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <UApp>
    <div class="flex flex-col min-h-screen">
      <UHeader class="shrink-0">
        <template #left>
          <NuxtLink to="/" class="font-semibold text-lg">
            GPT Visualizer
          </NuxtLink>
        </template>

        <template #right>
          <UColorModeButton />

          <UButton
            to="https://github.com/nuxt-ui-templates/starter"
            target="_blank"
            icon="i-simple-icons-github"
            aria-label="GitHub"
            color="neutral"
            variant="ghost"
          />
        </template>
      </UHeader>

      <UMain class="flex flex-1 flex flex-col min-h-0">
        <NuxtPage class="h-full flex flex-col min-h-0" />
      </UMain>
    </div>
  </UApp>
</template>
