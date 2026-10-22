import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../success.html',import.meta.url),'utf8');
const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
async function render(search,data,ok=true){
 const elements=new Map();
 const document={getElementById(id){if(!elements.has(id))elements.set(id,{hidden:true,textContent:'',addEventListener(){}});return elements.get(id);}};
 const context=vm.createContext({document,location:{search},URLSearchParams,URL,Intl,window:{print(){}},fetch:async()=>({ok,json:async()=>data})});
 vm.runInContext(script,context);await new Promise(resolve=>setImmediate(resolve));return elements;
}
test('paid receipt displays correct amount and official link',async()=>{const ui=await render('?session_id=cs_test_example',{paid:true,name:'Test Registrant',amount:5000,currency:'usd',reference:'cs_test_example',receiptUrl:'https://pay.stripe.com/receipts/example'});assert.equal(ui.get('receipt').hidden,false);assert.equal(ui.get('amount').textContent,'$50.00');assert.equal(ui.get('stripeReceipt').hidden,false);});
test('pending and failed payments never display paid receipt',async()=>{for(const [data,ok] of [[{paid:false,message:'Pending'},true],[{error:'Try again'},false]]){const ui=await render('?session_id=cs_test_example',data,ok);assert.equal(ui.get('receipt'),undefined);assert.equal(ui.get('retry').hidden,false);}});
test('missing session gives useful instructions',async()=>{const ui=await render('',{});assert.match(ui.get('message').textContent,/do not submit another payment/);assert.equal(ui.get('receipt'),undefined);});
