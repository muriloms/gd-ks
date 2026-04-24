import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { renderTemplate } from '../../src/core/templates/template-conditionals.js';

describe('template-conditionals', () => {
  describe('renderTemplate()', () => {
    it('throws if template is not a string', () => {
      assert.throws(() => renderTemplate(null, { engineId: 'unreal-5' }), /must be a string/);
      assert.throws(() => renderTemplate(42, { engineId: 'unreal-5' }), /must be a string/);
    });

    it('throws if context.engineId is missing', () => {
      assert.throws(() => renderTemplate('hello', {}), /engineId is required/);
    });

    it('passes through templates with no engine blocks', () => {
      const tpl = '# Hello\n\nJust some markdown.';
      const out = renderTemplate(tpl, { engineId: 'unreal-5' });
      assert.equal(out, tpl);
    });

    it('keeps content of matching engine block', () => {
      const tpl = `# Story
{{#engine unreal-5}}
Use UPROPERTY macros.
{{/engine}}`;
      const out = renderTemplate(tpl, { engineId: 'unreal-5' });
      assert.ok(out.includes('UPROPERTY macros'));
    });

    it('removes content of non-matching engine block', () => {
      const tpl = `# Story
{{#engine godot-4}}
Use @export.
{{/engine}}`;
      const out = renderTemplate(tpl, { engineId: 'unreal-5' });
      assert.ok(!out.includes('Use @export'));
    });

    it('handles multiple engine blocks, keeping only the matching one', () => {
      const tpl = `## Notes
{{#engine unreal-5}}
C++ and Blueprint.
{{/engine}}
{{#engine godot-4}}
GDScript.
{{/engine}}
{{#engine unity-6}}
C#.
{{/engine}}`;
      const out = renderTemplate(tpl, { engineId: 'unreal-5' });
      assert.ok(out.includes('C++ and Blueprint'));
      assert.ok(!out.includes('GDScript'));
      assert.ok(!out.includes('C#.'));
    });

    it('handles engine-not blocks', () => {
      const tpl = `{{#engine-not unreal-5}}
This is not UE5.
{{/engine-not}}`;
      const out1 = renderTemplate(tpl, { engineId: 'unreal-5' });
      assert.ok(!out1.includes('This is not UE5'));

      const out2 = renderTemplate(tpl, { engineId: 'godot-4' });
      assert.ok(out2.includes('This is not UE5'));
    });

    it('substitutes {{ engine.id }}', () => {
      const tpl = 'Using {{ engine.id }} today.';
      const out = renderTemplate(tpl, { engineId: 'godot-4' });
      assert.equal(out, 'Using godot-4 today.');
    });

    it('substitutes {{ engine.name }} when profile is provided', () => {
      const tpl = 'Welcome to {{ engine.name }}!';
      const context = {
        engineId: 'unreal-5',
        engine: { engine: { name: 'Unreal Engine 5' } }
      };
      const out = renderTemplate(tpl, context);
      assert.equal(out, 'Welcome to Unreal Engine 5!');
    });

    it('leaves {{ engine.name }} untouched when profile is absent', () => {
      const tpl = 'Welcome to {{ engine.name }}!';
      const out = renderTemplate(tpl, { engineId: 'unreal-5' });
      assert.ok(out.includes('{{ engine.name }}'));
    });

    it('collapses excess blank lines left by removed blocks', () => {
      const tpl = `Before.

{{#engine godot-4}}
Removed content.
{{/engine}}

After.`;
      const out = renderTemplate(tpl, { engineId: 'unreal-5' });
      // Should NOT have 3+ consecutive newlines
      assert.ok(!/\n{3,}/.test(out), `Got:\n${JSON.stringify(out)}`);
      assert.ok(out.includes('Before.'));
      assert.ok(out.includes('After.'));
    });

    it('supports nested engine blocks in sequence (not nested inside each other)', () => {
      const tpl = `Story 1:
{{#engine unreal-5}}UE5 for story 1{{/engine}}

Story 2:
{{#engine unreal-5}}UE5 for story 2{{/engine}}`;
      const out = renderTemplate(tpl, { engineId: 'unreal-5' });
      assert.ok(out.includes('UE5 for story 1'));
      assert.ok(out.includes('UE5 for story 2'));
    });
  });
});
