{ self, pkgs }:

let

  inherit (pkgs) buildNpmPackage;

in buildNpmPackage {
  name = "nixjs-rt";
  src = self;
  npmDepsHash = "sha256-pb8WTesMyb1VCU/1nEgcFAIC1iZ4afZHV4NEEJS4x8A=";
}