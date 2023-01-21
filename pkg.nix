{ self, pkgs }:

let

  inherit (pkgs) buildNpmPackage;

in buildNpmPackage {
  name = "nixrt";
  src = self;
  npmDepsHash = "sha256-oQS9RCkinBAmwD7v6uMLLO81VRd9ADiTKubIbyvdFsE=";
}