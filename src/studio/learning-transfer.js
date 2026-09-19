'use strict';
const {listLessons,listChallenges,topicForTask}=require('./challenges');
const {normaliseEvent,MAX_EVENTS}=require('./learning-evidence');
const {RELEASE}=require('./verification');
const levels=['year1','year2','year3','all'];
const lessons=new Set(levels.flatMap(level=>listLessons(level).map(s=>s.id)));
const challenges=new Set(levels.flatMap(level=>listChallenges(level).map(s=>s.id)));
const topics=new Set([...lessons].map(id=>topicForTask('lesson',id)).concat([...challenges].map(id=>topicForTask('challenge',id))));
const record=value=>value && typeof value==='object' && !Array.isArray(value);
function progress(value,allowed) {
    if(!record(value)) throw new Error('Progress must be an object.');
    const out={};
    for(const [id,complete] of Object.entries(value)) {
        if(!allowed.has(id)||typeof complete!=='boolean') throw new Error('Progress contains an unknown activity or invalid completion value.');
        if(complete) out[id]=true;
    }
    return out;
}
function validate(input) {
    if(!record(input)||input.format!=='BeamLabLearning'||input.schema!==1) throw new Error('Choose a BeamLab learning-progress export (schema 1).');
    const clean={format:'BeamLabLearning',schema:1,release:RELEASE,lessons:progress(input.lessons,lessons),challenges:progress(input.challenges,challenges),mastery:{},events:[]};
    if(!record(input.mastery)) throw new Error('Invalid mastery data.');
    for(const [topic,stat] of Object.entries(input.mastery)) {
        if(!topics.has(topic)||!record(stat)) throw new Error('Unknown mastery topic.');
        const s={};
        for(const key of ['attempts','firstAttempts','firstCorrect','correct','reveals','lastAt']) {
            const value=stat[key]??0;
            if(!Number.isSafeInteger(value)||value<0||value>(key==='lastAt'?8640000000000000:10000000)) throw new Error('Mastery counters must be non-negative finite integers.');
            s[key]=value;
        }
        if(s.correct>s.attempts||s.firstAttempts>s.attempts||s.firstCorrect>s.firstAttempts||s.firstCorrect>s.correct) throw new Error('Mastery counters are inconsistent.');
        clean.mastery[topic]=s;
    }
    if(!Array.isArray(input.events)||input.events.length>MAX_EVENTS) throw new Error('Learning history exceeds the bounded 24-event window.');
    clean.events=input.events.map(e=>{
        if(!record(e)||!['attempt','reveal','skip'].includes(e.event)||!Number.isFinite(e.timestamp)||e.timestamp<0) throw new Error('Invalid learning event.');
        return normaliseEvent(e);
    });
    return clean;
}
function create(lessonProgress,challengeProgress,mastery,events) {
    return {...validate({format:'BeamLabLearning',schema:1,lessons:lessonProgress,challenges:challengeProgress,mastery,events}),exportedAt:new Date().toISOString()};
}
function parse(text) {
    if(typeof text!=='string'||text.length>100000) throw new Error('Learning-progress file must be smaller than 100 kB.');
    return validate(JSON.parse(text));
}
function summary(state) {
    return {lessons:Object.keys(state.lessons).length,challenges:Object.keys(state.challenges).length,topics:Object.keys(state.mastery).length,events:state.events.length};
}
module.exports={create,parse,validate,summary};
