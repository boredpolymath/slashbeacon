"""
Automated unit tests for TruthBeacon release packaging and verification scripts.
"""

import os
import unittest


class TestPackagingScripts(unittest.TestCase):
    def setUp(self):
        self.project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        self.scripts_dir = os.path.join(self.project_root, "scripts")
        self.release_dir = os.path.join(self.project_root, "release")

    def test_scripts_exist_and_executable(self):
        expected_scripts = [
            "generate_installer_assets.py",
            "verify_packaging_pipeline.py",
            "verify_code_signing_pipeline.py",
            "sign_release_artifacts.py"
        ]
        for script_name in expected_scripts:
            script_path = os.path.join(self.scripts_dir, script_name)
            self.assertTrue(os.path.isfile(script_path), f"Missing script: {script_name}")

    def test_release_manifest_integrity(self):
        manifest_path = os.path.join(self.release_dir, "latest.json")
        self.assertTrue(os.path.isfile(manifest_path), "Missing release/latest.json")

    def test_js_test_coverage_ratio(self):
        ui_js_dir = os.path.join(self.project_root, "ui", "js")
        website_js_dir = os.path.join(self.project_root, "website", "js")
        tests_dir = os.path.join(self.project_root, "tests")

        js_sources = [
            f for f in os.listdir(ui_js_dir) if f.endswith(".js")
        ] + [
            f for f in os.listdir(website_js_dir) if f.endswith(".js")
        ]
        self.assertEqual(len(js_sources), 13, f"Expected 13 JS source files, found {len(js_sources)}")

        js_tests = [f for f in os.listdir(tests_dir) if f.endswith(".test.js")]
        coverage_ratio = len(js_tests) / len(js_sources)
        self.assertGreaterEqual(
            coverage_ratio,
            1.0,
            f"JS test coverage ratio ({coverage_ratio:.2f}) must be at least 1.0 (1 test file per source file)"
        )


if __name__ == "__main__":
    unittest.main()
