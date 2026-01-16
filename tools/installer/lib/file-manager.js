/**
 * GD-KS File Manager
 * Handles file system operations
 */

import { mkdir, writeFile, readFile, copyFile, readdir, stat, access } from 'fs/promises';
import { join, dirname } from 'path';
import yaml from 'js-yaml';

export class FileManager {
  /**
   * Ensure a directory exists
   */
  async ensureDir(dirPath) {
    try {
      await mkdir(dirPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Check if a path exists
   */
  async exists(filePath) {
    try {
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Write content to a file
   */
  async writeFile(filePath, content) {
    await this.ensureDir(dirname(filePath));
    await writeFile(filePath, content, 'utf-8');
  }

  /**
   * Read content from a file
   */
  async readFile(filePath) {
    return await readFile(filePath, 'utf-8');
  }

  /**
   * Write YAML content to a file
   */
  async writeYaml(filePath, data) {
    const content = yaml.dump(data, {
      indent: 2,
      lineWidth: 120,
      noRefs: true
    });
    await this.writeFile(filePath, content);
  }

  /**
   * Read YAML content from a file
   */
  async readYaml(filePath) {
    const content = await this.readFile(filePath);
    return yaml.load(content);
  }

  /**
   * Copy a file
   */
  async copy(source, target) {
    await this.ensureDir(dirname(target));
    await copyFile(source, target);
  }

  /**
   * Copy a directory recursively
   */
  async copyDir(source, target) {
    await this.ensureDir(target);
    
    const entries = await readdir(source, { withFileTypes: true });
    
    for (const entry of entries) {
      const sourcePath = join(source, entry.name);
      const targetPath = join(target, entry.name);
      
      if (entry.isDirectory()) {
        await this.copyDir(sourcePath, targetPath);
      } else {
        await this.copy(sourcePath, targetPath);
      }
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(dirPath, extension = null) {
    try {
      const entries = await readdir(dirPath, { withFileTypes: true });
      let files = entries
        .filter(entry => entry.isFile())
        .map(entry => entry.name);
      
      if (extension) {
        files = files.filter(file => file.endsWith(extension));
      }
      
      return files;
    } catch {
      return [];
    }
  }

  /**
   * Get file stats
   */
  async getStats(filePath) {
    return await stat(filePath);
  }
}
