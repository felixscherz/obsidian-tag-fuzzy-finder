#!/usr/bin/env uv run
import argparse
import json
import sys


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--version", required=True)
    parser.add_argument("--min-app-version", required=True)

    options = parser.parse_args()
    version = options.version
    min_app_version = options.min_app_version

    print(f"Preparing release for version={version}, minAppVersion={min_app_version}", file=sys.stderr)
    with open("./manifest.json") as f:
        manifest = json.load(f)

    manifest["version"] = version
    manifest["minAppVersion"] = min_app_version

    with open("./manifest.json", "w") as f:
        json.dump(manifest, f, sort_keys=True, indent=2)

    with open("./versions.json") as f:
        versions = json.load(f)

    versions[version] = min_app_version

    with open("./versions.json", "w") as f:
        json.dump(versions, f, sort_keys=True, indent=2)


if __name__ == "__main__":
    main()
