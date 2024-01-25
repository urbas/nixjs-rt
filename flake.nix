{
  description = "A library that implements Nix language semantics in JS.";

  inputs.nixpkgs.url = "nixpkgs/nixpkgs-unstable";

  outputs = { self, nixpkgs }:
    let
      forAllSystems = f: nixpkgs.lib.genAttrs [ "x86_64-linux" "aarch64-linux" ] (system: f { pkgs = import nixpkgs { inherit system; }; });

      devPkgs = pkgs: with pkgs; [
        nodejs
        parallel
        prefetch-npm-deps
      ];

    in {
      packages = forAllSystems ({pkgs}: with pkgs; {
        default = import ./pkg.nix { inherit pkgs self; };

        devEnv = buildEnv {
          name = "devEnv";
          paths = devPkgs pkgs;
        };
      });

      devShells = forAllSystems ({pkgs}: with pkgs; {
        default = stdenv.mkDerivation {
          name = "nixjs-rt";
          buildInputs = devPkgs pkgs;
        };
      });
    };
}
