/** One column of a data grid. */
export interface GridColumn {
  key: string;                                            // property name on each row
  label: string;                                          // header text
  align?: 'left' | 'right' | 'center';
  type?: 'text' | 'number' | 'currency' | 'date' | 'datetime';
  sortable?: boolean;                                     // default true
  hideOnSmall?: boolean;                                  // hidden below 640px wide
  wrap?: boolean;                                         // long text wraps onto several lines
  width?: string;                                         // for example '120px'
}
