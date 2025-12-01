# Numark Mixstream Pro Mapping

This is a mapping for the [Numark Mixstream Pro](https://www.numark.com/product/mixstream-pro) for Mixxx. Wherever possible I have defaulted to Engine OS behaviour outlined in the user manual. When that was not possible I have used Mixxx default behaviour to model certain functions. This is a collaborative effort with @audministrator who created the first versions of it in [this thread](https://mixxx.discourse.group/t/numark-mixstream-pro-mapping/24858).

## Roadmap Issues
- [ ] Autoloop should continue from the same origin beat when changed ?
- [ ] Scratch mode doesnt snap back upon releasing finger from platter

## Other Issues
- Stems mode (Shift + Hotcue) will be implemented when it's added to Mixxx.
- Playing beatlooprolls during an autoloop will cause the loop to stay when releasing the roll pad. This is because Mixxx doesn't have distinction between different types of loops
- Occasionally a saved loop won't begin playing immediately after being saved. This also happens to autoloop and roll as well. I think this might happen if the playhead snaps to the beat grid behind it.