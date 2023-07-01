# First-time dev env set up

## Shell

1. Install the nix package manager:
   https://nixos.org/manual/nix/stable/installation/installation.html

2. Install direnv: https://direnv.net/

Once you enter this directory in your shell, the NodeJS tooling should be
automatically set up. You can verify this with:

```bash
# This should match the version specified in `rust-toolchain.toml`
npm --version
```

## Editor

You must follow the "Shell" instructions above to make sure the `.direnv`
folder is populated. After that all the needed tooling will be in the `PATH`.

### VSCode

Install the [direnv vscode extension](https://github.com/direnv/direnv-vscode).

# Building & Testing

```bash
# Building:
# This will build TypeScript srouces from `src/*.ts` and place the resulting files into the `dist` folder
npm run build
# Same as `build`, but will watch changes in the `src` folder and continuously update the `dist` folder.
npm run build-watch

# Testing:
# This runs all tests once
npm run test
# This runs tests continuously every time sources in the `src` folder change
npm run test-watch

# Formatting:
npm run fmt
```

# Debugging

1. Use the `Debug: JavaScript Debug Terminal` action and VSCode will open a new terminal.
2. Now set a breakpoint somewhere in your code.
3. Run tests with `npm run test` and VSCode will break at the given breakpoint.

## Updating dependencies

Update the version of NodeJS:

```bash
nix flake update
```

Update the version of JavaScript dependencies:

```bash
npm update
```
