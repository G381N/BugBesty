This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# bugbesty

# BugBestie - Web Security Scanner & Vulnerability Manager

## Report Generation Feature

The report generation feature requires a Google Gemini API key to work properly. Without a valid API key, the system will use a fallback local report generator, but the results will be simpler and less detailed.

### How to Get a Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create or sign in to your Google account
3. Click on "Get API key" button
4. Create a new API key or use an existing one
5. Copy the API key

### Setting Up Your API Key

Add your Gemini API key to the `.env` file in the frontend directory:

```
NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
```

After adding the API key, restart the development server for the changes to take effect:

```bash
npm run dev
```

## Troubleshooting

If you encounter API key errors when generating reports:

1. Make sure you've added the correct API key to the `.env` file
2. Ensure the environment variable is named exactly `NEXT_PUBLIC_GEMINI_API_KEY`
3. Restart the development server after making changes
4. Check that your API key is active and has not reached usage limits

If problems persist, the application will automatically use the fallback report generator, which does not require an API key.
