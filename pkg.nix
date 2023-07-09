{ self, pkgs }:

let

  inherit (pkgs) buildNpmPackage;

in buildNpmPackage {
  name = "nixrt";
  src = self;
  npmDepsHash = "sha256-yyC5WrVRfVPyR2DRFxiXKlpJ+WbwZbWoUxmd4uA8O/Y=";
}