import assert from 'node:assert/strict'
import test from 'node:test'
import { passportBands, passportPage } from './passport.ts'
test('six independent bands keep real progress and never synthesize routes or earned stamps', () => {
 const bands=passportBands([{route_id:'a',grade_label:'6A / +',sort_order:1,completed:true,status:'complete'}, {route_id:'b',grade_label:'7c/+',sort_order:0,completed:false,status:'pending_verify'}])
 assert.equal(bands.length,6); assert.equal(bands[0].completed,1); assert.equal(bands[5].completed,0)
 assert.equal(bands[1].routes.length,0); assert.equal(bands[5].routes[0].status,'pending_verify')
 assert.equal(passportBands([]).flatMap(b=>b.routes).length,0)
})
test('only known page states restore from navigation',()=>{
 assert.equal(passportPage('back'),'back'); assert.equal(passportPage('front'),'front'); assert.equal(passportPage('bogus'),'cover')
})
