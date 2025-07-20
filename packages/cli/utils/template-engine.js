import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class TemplateEngine {
  static templatesDir = path.join(__dirname, '..', 'templates', 'generators');

  static replaceVariables(template, variables) {
    let result = template;
    
    // Replace all template variables
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    }
    
    return result;
  }

  static toPascalCase(str) {
    return str
      .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''))
      .replace(/^[a-z]/, char => char.toUpperCase());
  }

  static toCamelCase(str) {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  static toKebabCase(str) {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  static toSnakeCase(str) {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s-]+/g, '_')
      .toLowerCase();
  }

  static async loadTemplate(templateName) {
    const templatePath = path.join(this.templatesDir, `${templateName}.template`);
    
    if (!await fs.pathExists(templatePath)) {
      throw new Error(`Template ${templateName} not found at ${templatePath}`);
    }
    
    return await fs.readFile(templatePath, 'utf-8');
  }

  static async generateFromTemplate(templateName, outputPath, variables) {
    const template = await this.loadTemplate(templateName);
    const content = this.replaceVariables(template, variables);
    
    // Ensure directory exists
    await fs.ensureDir(path.dirname(outputPath));
    
    // Write file
    await fs.writeFile(outputPath, content);
    
    return outputPath;
  }
}
