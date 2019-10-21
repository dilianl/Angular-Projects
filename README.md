# File upload


## Screenshots
![screenshot](https://negometrix-my.sharepoint.com/personal/stefan_sinapov_negometrix_bg/_layouts/15/guestaccess.aspx?guestaccesstoken=RUdzVKb7urZaCEw6hUrE5figGnsnqEou7tmz1xmCeUE%3d&docid=012aba96a425f4e24b5f9681bbc88611b&rev=1)

### Bound Properties

| Name | Type | Description |
| --- | --- | --- |
| `ownerId` | `number` | The identifier of the owner of the document that will be created. |
| `returnType` | `"Id"|"Info"` | Type of returned values after component is closed(with save). If id it will return list of Ids `number[]`. If `"Info"` it will return list of `NX1.Model.DocumentInfo[]` |

### Events

| Name | Type | Description |
| --- | --- | --- |
| `save` | `number[]|NX1.Model.Document[]` | Emitted when image is saved. Returns collection of identifiers of the uploaded files. |
| `close` | | TODO(stefan.sinapov) not sure if close event should be on upload-avatar or on side-panel.  |

### Notes
This component should be used inside `SidePanelComponent` or `MdDialog`

## Examples

Here's a simple example of using the Upload Avatar:

```ts
public addFile(viewContainerRef: ViewContainerRef, sidePanelService: SidePanelService, ownerId: number) {
    const config = new SidePanelConfig();
    config.viewContainerRef = viewContainerRef;

    let fileUploadRef = sidePanelService.open(FileUploadComponent, config);
    fileUploadRef.componentInstance.ownerId = ownerId;
    const saveSub = fileUploadRef.componentInstance.save
        .mergeMap((documentIds: number[]) => this.contentManagerService
            .createLinkDocuments(this.info.EntityId, this.info.Guid, documentIds))
        .subscribe(() => {
            saveSub.unsubscribe();
        });

    const closeSub = fileUploadRef.afterClosed()
        .subscribe(() => {
            fileUploadRef = null;
            closeSub.unsubscribe();
        });
}
```

