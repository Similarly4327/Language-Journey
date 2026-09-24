(() => {
  const fallback='nl';
  const supported=['nl','en','de'];
  const missing=new Set();
  const localeTag={nl:'nl-NL',en:'en-GB',de:'de-DE'};
  function language(value){return supported.includes(value)?value:fallback}
  function translate(key,locale=fallback,values={}){
    const selected=language(locale),resources=window.LanguageJourneyLocales||{};
    let value=resources[selected]?.[key];
    if(value==null){
      value=resources[fallback]?.[key];
      if(!missing.has(`${selected}:${key}`)){missing.add(`${selected}:${key}`);console.warn(`Ontbrekende vertaling: ${selected}.${key}`)}
    }
    if(value==null)return key;
    return String(value).replace(/\{([\w]+)\}/g,(_,name)=>values[name]??`{${name}}`);
  }
  function date(value,locale=fallback,options={day:'numeric',month:'short',year:'numeric'}){
    return new Intl.DateTimeFormat(localeTag[language(locale)],options).format(new Date(value));
  }
  function number(value,locale=fallback,options={}){
    return new Intl.NumberFormat(localeTag[language(locale)],options).format(value);
  }
  function plural(key,count,locale=fallback,values={}){
    const form=new Intl.PluralRules(localeTag[language(locale)]).select(count);
    return translate(`${key}.${form}`,locale,{...values,count:number(count,locale)});
  }
  function localizeNodes(container,locale=fallback){
    const sources=window.LanguageJourneyLegacyUiKeys||{},known=new Map();
    for(const [source,key] of Object.entries(sources)){
      known.set(source,key);
      for(const option of supported){const text=window.LanguageJourneyLocales?.[option]?.[key];if(text)known.set(text,key)}
    }
    const walker=document.createTreeWalker(container,NodeFilter.SHOW_TEXT);
    for(let node=walker.nextNode();node;node=walker.nextNode()){
      const original=node.textContent,trimmed=original.trim(),key=known.get(trimmed);
      if(key){const replacement=translate(key,locale);if(replacement!==trimmed)node.textContent=original.replace(trimmed,replacement)}
    }
    for(const element of container.querySelectorAll('[placeholder],[aria-label],[title]')){
      for(const attribute of ['placeholder','aria-label','title']){
        const original=element.getAttribute(attribute),key=known.get(original);
        if(key)element.setAttribute(attribute,translate(key,locale));
      }
    }
  }
  window.LanguageJourneyI18n={fallback,supported,language,translate,date,number,plural,localizeNodes};
})();
