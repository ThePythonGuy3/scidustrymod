var entities = {}; // using a centralized dictionary as fields of OverflowGateEntity are private
function convert(entity) {
    if (entities[entity.id] == undefined) {
        entities[entity.id] = {lastItem: null, lastInput: null, time: 0, items: entity.items}
    }
    return entities[entity.id]
}

const router = Vars.content.getByName(ContentType.block, 'router');

const duper = extendContent(Router, "dupe", {
    update(tile){
        var entity = tile.ent();

        if(entity.lastItem == null && entity.items.total() > 0){
            entity.items.clear();
        }

        if(entity.lastItem != null){
            entity.time += 1f / speed * Time.delta();
            var target = getTileTarget(tile, entity.lastItem, entity.lastInput, false);

            if(target != null && (entity.time >= 1f || !(target.block() instanceof Router))){
                getTileTarget(tile, entity.lastItem, entity.lastInput, true);
                target.block().handleItem(entity.lastItem, target, Edges.getFacingEdge(tile, target));
                entity.items.remove(entity.lastItem, 1);
                entity.lastItem = null;
            }
        }
    }

    acceptItem(item, tile, source){
        var entity = tile.ent();

        return tile.getTeam() == source.getTeam() && entity.lastItem == null && entity.items.total() == 0;
    }

    handleItem(item, tile, source){
        var entity = tile.ent();
        entity.items.add(item, 1);
        entity.lastItem = item;
        entity.time = 0f;
        entity.lastInput = source;
    }

    getTileTarget(tile, item, from, set){
        var[] proximity = tile.entity.proximity();
        var counter = tile.rotation();
        for(int i = 0; i < proximity.size; i++){
            var other = proximity.get((i + counter) % proximity.size);
            if(set) tile.rotation((byte)((tile.rotation() + 1) % proximity.size));
            if(other == from && from.block() == Blocks.overflowGate) continue;
            if(other.block().acceptItem(item, other, Edges.getFacingEdge(tile, other))){
                return other;
            }
        }
        return null;
    }

    removeStack(tile, item, amount){
        var entity = tile.ent();
        var result = super.removeStack(tile, item, amount);
        if(result != 0 && item == entity.lastItem){
            entity.lastItem = null;
        }
        return result;
    }
})
