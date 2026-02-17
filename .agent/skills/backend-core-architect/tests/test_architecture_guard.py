
import sys
import os
import unittest
from unittest.mock import patch, mock_open


# Add scripts directory to sys.path to allow importing architecture_guard
current_dir = os.path.dirname(os.path.abspath(__file__))
scripts_dir = os.path.join(current_dir, '..', 'scripts')
sys.path.append(scripts_dir)

import architecture_guard

class TestArchitectureGuard(unittest.TestCase):
    
    def test_get_layer_core(self):
        self.assertEqual(architecture_guard.get_layer('src/core/user.ts'), 'core')
        self.assertEqual(architecture_guard.get_layer('c:/project/src/core/domain/entity.ts'), 'core')

    def test_get_layer_infrastructure(self):
        self.assertEqual(architecture_guard.get_layer('src/infrastructure/db.ts'), 'infrastructure')

    def test_get_layer_interface(self):
        self.assertEqual(architecture_guard.get_layer('src/interface/api.ts'), 'interface')

    def test_get_layer_none(self):
        self.assertIsNone(architecture_guard.get_layer('src/utils/helper.ts'))
        self.assertIsNone(architecture_guard.get_layer('README.md'))

    def test_check_file_architecture_no_violations(self):
        file_content = """
        import { Entity } from './entity';
        import { ValueObject } from '@core/value-object';
        """
        forbidden = ['infrastructure']
        
        with patch('builtins.open', mock_open(read_data=file_content)):
             violations = architecture_guard.check_file_architecture('src/core/usecase.ts', 'core', forbidden)
             self.assertEqual(len(violations), 0)

    def test_check_file_architecture_with_violations(self):
        file_content = """
        import { UserRepository } from '@infrastructure/db/repo';
        import { Controller } from 'src/interface/controller';
        """
        forbidden = ['infrastructure', 'interface']
        
        with patch('builtins.open', mock_open(read_data=file_content)):
             violations = architecture_guard.check_file_architecture('src/core/usecase.ts', 'core', forbidden)
             self.assertEqual(len(violations), 2)
             self.assertIn("violates rule: cannot import 'infrastructure'", violations[0])
             self.assertIn("violates rule: cannot import 'interface'", violations[1])

    def test_check_file_architecture_relative_import_violation(self):
        # This test assumes the logic catches 'infrastructure' text in import path if 'src/' is present
        # This is based on line 65: (forbidden_str in import_path and 'src/' in import_path)
        file_content = "import { Something } from '../../src/infrastructure/bad';"
        forbidden = ['infrastructure']
        
        with patch('builtins.open', mock_open(read_data=file_content)):
             violations = architecture_guard.check_file_architecture('src/core/usecase.ts', 'core', forbidden)
             self.assertEqual(len(violations), 1)

if __name__ == '__main__':
    unittest.main()
