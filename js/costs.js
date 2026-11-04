/* One estimate for course previews, Build, Review and change previews. Source amounts are JPY. */
window.MD = window.MD || {};
MD.costs = (() => {
  function quote(s, plan = MD.planner.schedule(s)) {
    const ids = [...new Set(plan.days.flatMap(d => [...d.items, ...d.extras].map(a => a.id)))];
    const activities = ids.reduce((sum, id) => sum + (MD.data.byId[id].price || 0), 0);
    const stay = MD.stay.quote(s), party = stay.party;
    const vanDays = plan.days.filter(d => d.items.length || d.extras.length).length;
    const vanGroup = vanDays * MD.assume.v.vanPerDay, van = Math.round(vanGroup / party);
    const rail = MD.data.railReturn + (MD.assume.v.localRailReturn || 0);
    return { activities, stay: stay.perPerson, rail, van, vanDays, vanGroup, party,
      groupTotal: activities * party + stay.total + vanGroup,
      total: activities + stay.perPerson + van };
  }
  return { quote };
})();
