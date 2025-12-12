# Changelog

## [0.2.0](https://github.com/SDamasceno-Dev/Aleara/compare/aleara-web-v0.1.0...aleara-web-v0.2.0) (2025-12-08)


### Features

* add "Limpar resultado" button in Mega-Sena game to reset draw results and matches ([f7a63b3](https://github.com/SDamasceno-Dev/Aleara/commit/f7a63b3e2f505e2ee6beb506c672f0b4c9887767))
* add functionality for managing saved bet lists in Mega-Sena game, including loading, saving, and deleting lists ([53178e6](https://github.com/SDamasceno-Dev/Aleara/commit/53178e69a2031d3b2e26822879b978256b835912))
* add loading overlay component and integrate it across Mega-Sena panels for improved user experience during data processing ([dabbd3c](https://github.com/SDamasceno-Dev/Aleara/commit/dabbd3ce45353e34c332c1ea06a9b8dd9e214ac4))
* add matches summary display in Mega-Sena game to show counts of correct guesses (4/5/6) ([c8cc049](https://github.com/SDamasceno-Dev/Aleara/commit/c8cc0492fa5057aae51acbd452be38f04d7ca441))
* add ReportsPanel to Mega-Sena page for displaying game reports ([fce85ef](https://github.com/SDamasceno-Dev/Aleara/commit/fce85efcc577b16a50ba001d44e71c2bcd4bd6fc))
* add resampling functionality to Mega-Sena game, allowing users to regenerate game samples based on existing parameters ([07353f5](https://github.com/SDamasceno-Dev/Aleara/commit/07353f5c2e3e5e3b01f72b2edbc2920618bcb343))
* add SITE_URL configuration for email auth links and refactor Quina components for improved layout and functionality ([eb06b8f](https://github.com/SDamasceno-Dev/Aleara/commit/eb06b8f404b6ba77c781038a7850996f599aef85))
* display app version and revision in footer for better user awareness ([#19](https://github.com/SDamasceno-Dev/Aleara/issues/19)) ([f96f3eb](https://github.com/SDamasceno-Dev/Aleara/commit/f96f3eb25e34563557dc07518192daf196588699))
* enhance Mega-Sena game functionality with variable-length bets and improved input handling ([31ab9ee](https://github.com/SDamasceno-Dev/Aleara/commit/31ab9eece1d639ec6d63ba0ba7844dff9b48ce5a))
* enhance Quina game functionality with CSV import, bet management, and improved error handling ([0c3cb29](https://github.com/SDamasceno-Dev/Aleara/commit/0c3cb29c89f19c6457da0b5ae79078ae75bbdbe0))
* enhance ReportsPanel with detailed and aggregate report loading, including error handling and user input for contest selection ([8f2cf2b](https://github.com/SDamasceno-Dev/Aleara/commit/8f2cf2b6b81bc718a26cd86a697f2228c33ce44d))
* implement API routes for adding items and appending generated combinations in Mega-Sena game ([39e6526](https://github.com/SDamasceno-Dev/Aleara/commit/39e6526f1c67956cef7ca52aed0112533629b1c1))
* implement Quina page with user authentication, dynamic tabs, and data panels for enhanced user experience ([c47e284](https://github.com/SDamasceno-Dev/Aleara/commit/c47e284e5e1cc9f8b8142f64fe26fcbcbb2bf556))
* implement save-check modal in Mega-Sena game for saving contest results with validation and loading states ([4332a55](https://github.com/SDamasceno-Dev/Aleara/commit/4332a55d44938bb62ea8613cb041f0a0a872000e))
* integrate PDF report generation for Mega-Sena with React, including aggregate and contest-specific reports, and add export functionality in ReportsPanel ([fe20e25](https://github.com/SDamasceno-Dev/Aleara/commit/fe20e2572a671f0bcdb8f189e004cd6e1be824c6))


### Bug Fixes

* correct binomial coefficient calculation in Mega-Sena game route for accurate result generation ([58491eb](https://github.com/SDamasceno-Dev/Aleara/commit/58491eb81a0ca10f74920f2950f2407a9c0ac7a9))
* ensure SITE_URL/NEXT_PUBLIC_SITE_URL is configured in production for invite batch and resend invite routes ([1820b12](https://github.com/SDamasceno-Dev/Aleara/commit/1820b120b5e0f2af194e0eabc5fabac8c8c34fb9))
* ensure SITE_URL/NEXT_PUBLIC_SITE_URL is configured in production… ([8787840](https://github.com/SDamasceno-Dev/Aleara/commit/8787840e24debd511dc2983ab5bd9cd1df236389))
* improve binomial coefficient calculation in Mega-Sena game route for better accuracy and performance ([6a3b443](https://github.com/SDamasceno-Dev/Aleara/commit/6a3b443b612875eceec4b71cd0d87095f23dcc37))
* remove TypeScript error suppression in user deletion route for cleaner code and improved type safety ([3918d28](https://github.com/SDamasceno-Dev/Aleara/commit/3918d280bda3f31634aa3d849ee25b2c0fc3eab0))
* update Content Security Policy in Next.js configuration to allow 'unsafe-inline' scripts for production, with a note on migrating to nonce-based CSP ([ce781eb](https://github.com/SDamasceno-Dev/Aleara/commit/ce781eb928bcbd8c22b8b713bcc143ee3871e826))
* update GET handler in Mega-Sena route to use NextRequest and handle setId as a promise for improved parameter management ([d371def](https://github.com/SDamasceno-Dev/Aleara/commit/d371def08746c7d76095a8350e617c0c058333ef))
* update PDF report generation in Mega-Sena to ensure proper type handling and improve response format for better compatibility ([3ef48e0](https://github.com/SDamasceno-Dev/Aleara/commit/3ef48e087e3a9cf6d3e7951359b1ed5551964d28))
* update signout route to use 303 status code for redirects, ensuring proper handling of POST requests ([9142d77](https://github.com/SDamasceno-Dev/Aleara/commit/9142d77561bd94d318a06e77a5ec4a24ec9b4d0c))
* update Supabase client initialization to use public environment variables for browser configuration ([2153b6a](https://github.com/SDamasceno-Dev/Aleara/commit/2153b6a6113a748dc21717fddac6e31f0c4248ce))
