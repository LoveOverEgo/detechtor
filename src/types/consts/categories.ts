// Common dependency categories for classification
export const DEPENDENCY_CATEGORIES = {
    // Frontend Frameworks
    REACT: 'React Ecosystem',
    VUE: 'Vue Ecosystem',
    ANGULAR: 'Angular Ecosystem',
    SVELTE: 'Svelte Ecosystem',
    
    // Build Tools & Bundlers
    BUILD_TOOL: 'Build Tool',
    BUNDLER: 'Bundler',
    COMPILER: 'Compiler',
    TRANSPILER: 'Transpiler',
    
    // Styling
    CSS_FRAMEWORK: 'CSS Framework',
    CSS_IN_JS: 'CSS-in-JS',
    UI_LIBRARY: 'UI Component Library',
    ICON_LIBRARY: 'Icon Library',
    
    // State Management
    STATE_MANAGEMENT: 'State Management',
    
    // Routing
    ROUTING: 'Routing',
    
    // Data Fetching
    DATA_FETCHING: 'Data Fetching',
    GRAPHQL: 'GraphQL',
    
    // Testing
    TESTING: 'Testing Framework',
    ASSERTION: 'Assertion Library',
    MOCKING: 'Mocking Library',
    E2E: 'End-to-End Testing',
    COVERAGE: 'Code Coverage',
    
    // Linting & Formatting
    LINTER: 'Linter',
    FORMATTER: 'Code Formatter',
    TYPE_CHECKER: 'Type Checker',
    
    // Backend
    SERVER: 'Server Framework',
    DATABASE: 'Database',
    ORM: 'ORM',
    AUTH: 'Authentication',
    VALIDATION: 'Validation',
    
    // Utilities
    UTILITY: 'Utility Library',
    DATE: 'Date Manipulation',
    HTTP_CLIENT: 'HTTP Client',
    LOGGING: 'Logging',
    
    // Development
    DEVELOPMENT: 'Development Tool',
    HOT_RELOAD: 'Hot Reload',
    DEBUGGING: 'Debugging',
    
    // Types
    TYPES: 'Type Definitions',
    
    // Other
    OTHER: 'Other',
};

export const PACKAGE_CATEGORIES: { [key: string]: string } = {
    // React
    'react': DEPENDENCY_CATEGORIES.REACT,
    'react-dom': DEPENDENCY_CATEGORIES.REACT,
    'react-router': DEPENDENCY_CATEGORIES.ROUTING,
    'react-router-dom': DEPENDENCY_CATEGORIES.ROUTING,
    'redux': DEPENDENCY_CATEGORIES.STATE_MANAGEMENT,
    'mobx': DEPENDENCY_CATEGORIES.STATE_MANAGEMENT,
    'zustand': DEPENDENCY_CATEGORIES.STATE_MANAGEMENT,
    'next': DEPENDENCY_CATEGORIES.BUILD_TOOL,
    'gatsby': DEPENDENCY_CATEGORIES.BUILD_TOOL,
    'remix': DEPENDENCY_CATEGORIES.BUILD_TOOL,
    
    // Vue
    'vue': DEPENDENCY_CATEGORIES.VUE,
    'vue-router': DEPENDENCY_CATEGORIES.ROUTING,
    'vuex': DEPENDENCY_CATEGORIES.STATE_MANAGEMENT,
    'pinia': DEPENDENCY_CATEGORIES.STATE_MANAGEMENT,
    'nuxt': DEPENDENCY_CATEGORIES.BUILD_TOOL,
    
    // Angular
    '@angular/core': DEPENDENCY_CATEGORIES.ANGULAR,
    '@angular/common': DEPENDENCY_CATEGORIES.ANGULAR,
    
    // Svelte
    'svelte': DEPENDENCY_CATEGORIES.SVELTE,
    'sveltekit': DEPENDENCY_CATEGORIES.BUILD_TOOL,
    
    // Build Tools
    'webpack': DEPENDENCY_CATEGORIES.BUNDLER,
    'vite': DEPENDENCY_CATEGORIES.BUNDLER,
    'rollup': DEPENDENCY_CATEGORIES.BUNDLER,
    'parcel': DEPENDENCY_CATEGORIES.BUNDLER,
    'esbuild': DEPENDENCY_CATEGORIES.BUNDLER,
    'babel': DEPENDENCY_CATEGORIES.TRANSPILER,
    'typescript': DEPENDENCY_CATEGORIES.COMPILER,
    'swc': DEPENDENCY_CATEGORIES.COMPILER,
    
    // CSS Frameworks
    'tailwindcss': DEPENDENCY_CATEGORIES.CSS_FRAMEWORK,
    'bootstrap': DEPENDENCY_CATEGORIES.CSS_FRAMEWORK,
    'material-ui': DEPENDENCY_CATEGORIES.UI_LIBRARY,
    '@mui/material': DEPENDENCY_CATEGORIES.UI_LIBRARY,
    'antd': DEPENDENCY_CATEGORIES.UI_LIBRARY,
    'chakra-ui': DEPENDENCY_CATEGORIES.UI_LIBRARY,
    'styled-components': DEPENDENCY_CATEGORIES.CSS_IN_JS,
    'emotion': DEPENDENCY_CATEGORIES.CSS_IN_JS,
    'sass': DEPENDENCY_CATEGORIES.CSS_FRAMEWORK,
    'less': DEPENDENCY_CATEGORIES.CSS_FRAMEWORK,
    
    // Testing
    'jest': DEPENDENCY_CATEGORIES.TESTING,
    'vitest': DEPENDENCY_CATEGORIES.TESTING,
    'mocha': DEPENDENCY_CATEGORIES.TESTING,
    'jasmine': DEPENDENCY_CATEGORIES.TESTING,
    'cypress': DEPENDENCY_CATEGORIES.E2E,
    'playwright': DEPENDENCY_CATEGORIES.E2E,
    'puppeteer': DEPENDENCY_CATEGORIES.E2E,
    '@testing-library/react': DEPENDENCY_CATEGORIES.TESTING,
    '@testing-library/vue': DEPENDENCY_CATEGORIES.TESTING,
    '@testing-library/angular': DEPENDENCY_CATEGORIES.TESTING,
    'enzyme': DEPENDENCY_CATEGORIES.TESTING,
    'chai': DEPENDENCY_CATEGORIES.ASSERTION,
    'sinon': DEPENDENCY_CATEGORIES.MOCKING,
    
    // Linting & Formatting
    'eslint': DEPENDENCY_CATEGORIES.LINTER,
    'prettier': DEPENDENCY_CATEGORIES.FORMATTER,
    'stylelint': DEPENDENCY_CATEGORIES.LINTER,
    '@typescript-eslint/eslint-plugin': DEPENDENCY_CATEGORIES.LINTER,
    
    // Backend
    'express': DEPENDENCY_CATEGORIES.SERVER,
    'koa': DEPENDENCY_CATEGORIES.SERVER,
    'fastify': DEPENDENCY_CATEGORIES.SERVER,
    'nestjs': DEPENDENCY_CATEGORIES.SERVER,
    'mongoose': DEPENDENCY_CATEGORIES.ORM,
    'prisma': DEPENDENCY_CATEGORIES.ORM,
    'typeorm': DEPENDENCY_CATEGORIES.ORM,
    'sequelize': DEPENDENCY_CATEGORIES.ORM,
    'passport': DEPENDENCY_CATEGORIES.AUTH,
    'jsonwebtoken': DEPENDENCY_CATEGORIES.AUTH,
    'joi': DEPENDENCY_CATEGORIES.VALIDATION,
    'yup': DEPENDENCY_CATEGORIES.VALIDATION,
    'zod': DEPENDENCY_CATEGORIES.VALIDATION,
    
    // Utilities
    'lodash': DEPENDENCY_CATEGORIES.UTILITY,
    'underscore': DEPENDENCY_CATEGORIES.UTILITY,
    'moment': DEPENDENCY_CATEGORIES.DATE,
    'dayjs': DEPENDENCY_CATEGORIES.DATE,
    'date-fns': DEPENDENCY_CATEGORIES.DATE,
    'axios': DEPENDENCY_CATEGORIES.HTTP_CLIENT,
    'node-fetch': DEPENDENCY_CATEGORIES.HTTP_CLIENT,
    'winston': DEPENDENCY_CATEGORIES.LOGGING,
    'pino': DEPENDENCY_CATEGORIES.LOGGING,
    
    // GraphQL
    'graphql': DEPENDENCY_CATEGORIES.GRAPHQL,
    'apollo-server': DEPENDENCY_CATEGORIES.GRAPHQL,
    'apollo-client': DEPENDENCY_CATEGORIES.GRAPHQL,
    
    // Development
    'webpack-dev-server': DEPENDENCY_CATEGORIES.DEVELOPMENT,
    'nodemon': DEPENDENCY_CATEGORIES.DEVELOPMENT,
    'concurrently': DEPENDENCY_CATEGORIES.DEVELOPMENT,
    'dotenv': DEPENDENCY_CATEGORIES.DEVELOPMENT,
    
    // Type Definitions
    '@types/node': DEPENDENCY_CATEGORIES.TYPES,
    '@types/react': DEPENDENCY_CATEGORIES.TYPES,
    '@types/jest': DEPENDENCY_CATEGORIES.TYPES,
};
