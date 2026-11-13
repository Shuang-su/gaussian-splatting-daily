import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanRoute,matches,variantFor} from '../src/model.ts';
test('Chinese URLs and trailing slashes resolve to the captured route',()=>{assert.equal(cleanRoute('/tag/%E6%B4%BE%E6%97%A9%E6%8A%A5/'),'/tag/派早报');assert.equal(cleanRoute('/'),'/');});
test('search supports Chinese, mixed case and combined terms',()=>{assert(matches('派早报：OpenAI 发布 Dot 智能体','openai 智能体'));assert(matches('Affine-Aligned Atlas for Gaussian Construction','atlas gaussian'));assert(!matches('Gaussian Splatting','gaussian robot'));assert(matches('任何内容','  '));});
test('each site retains its observed breakpoint boundary',()=>{assert.equal(variantFor('sspai',767),'mobile');assert.equal(variantFor('sspai',768),'tablet');assert.equal(variantFor('radiance',809),'mobile');assert.equal(variantFor('radiance',810),'tablet');assert.equal(variantFor('radiance',1200),'desktop');});
