import { Interlocutor } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableRowActions } from './data-table-row-actions';
import { DataTableColumnHeader } from './data-table-column-header';
import { transformDateTime } from '@/utils/date.utils';
import { INTERLOCUTOR_FILTER_ATTRIBUTES } from '@/constants/interlocutor.filter-attributes';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const getInterlocutorColumns = (
  t: Function,
  tCommon: Function,
  context?: { firmId: number }
): ColumnDef<Interlocutor>[] => {
  const translationNamespace = 'contacts';
  const translate = (value: string, namespace: string = '') =>
    t(value, { ns: namespace || translationNamespace });

  const columns: ColumnDef<Interlocutor>[] = [
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={translate('interlocutor.attributes.title')}
          attribute={INTERLOCUTOR_FILTER_ATTRIBUTES.TITLE}
        />
      ),
      cell: ({ row }) => <div>{row.original.title}</div>,
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={translate('interlocutor.attributes.name')}
          attribute={INTERLOCUTOR_FILTER_ATTRIBUTES.NAME}
        />
      ),
      cell: ({ row }) => <div>{row.original.name}</div>,
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'surname',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={translate('interlocutor.attributes.surname')}
          attribute={INTERLOCUTOR_FILTER_ATTRIBUTES.SURNAME}
        />
      ),
      cell: ({ row }) => <div>{row.original.surname}</div>,
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'phone',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={translate('interlocutor.attributes.phone')}
          attribute={INTERLOCUTOR_FILTER_ATTRIBUTES.PHONE}
        />
      ),
      cell: ({ row }) => (
        <div>
          {row.original?.phone ? (
            row.original?.phone
          ) : (
            <span className="text-slate-400">{translate('interlocutor.empty_cells.phone')}</span>
          )}
        </div>
      ),
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={translate('interlocutor.attributes.email')}
          attribute={INTERLOCUTOR_FILTER_ATTRIBUTES.EMAIL}
        />
      ),
      cell: ({ row }) => (
        <div className="font-bold cursor-pointer hover:underline">{row.original.email}</div>
      ),
      enableSorting: true,
      enableHiding: true
    }
  ];

  // Conditionally add the "firms" column if `context?.firmId` is undefined
  if (!context?.firmId) {
    columns.push({
      accessorKey: 'firms',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={translate('interlocutor.attributes.firms')} />
      ),
      cell: ({ row }) => {
        const firms = row.original.firmsToInterlocutor || [];
        if (firms.length === 0) {
          return <div className="opacity-70">{translate('interlocutor.empty_cells.firms')}</div>;
        }

        const visibleFirms = firms.slice(0, 3); // Show up to 3 firms
        const hiddenFirms = firms.length - visibleFirms.length;

        return (
          <div>
            <div className="line-clamp-1">
              {visibleFirms.map((entry, index) => (
                <span key={index} className="mr-1">
                  {entry.firm?.name}
                  {index < visibleFirms.length - 1 && ', '}
                </span>
              ))}
              {hiddenFirms > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="font-extralight cursor-pointer mx-1">
                      {`+${hiddenFirms} more`}
                    </TooltipTrigger>
                    <TooltipContent>
                      {firms.slice(3).map((entry, index) => (
                        <p key={index}>{entry.firm?.name}</p>
                      ))}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: true
    });
  }

  // Conditionally add "position" and "is_main" columns if `context?.firmId` is provided
  if (context?.firmId) {
    columns.push(
      {
        accessorKey: 'position',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={translate('interlocutor.attributes.position')}
          />
        ),
        cell: ({ row }) => {
          const position = row.original.firmsToInterlocutor?.find(
            (firm) => firm.firmId === context.firmId
          )?.position;

          return (
            <div>
              {position ? (
                position
              ) : (
                <span className="text-slate-400">
                  {translate('interlocutor.empty_cells.position')}
                </span>
              )}
            </div>
          );
        },
        enableSorting: false,
        enableHiding: true
      },
      {
        accessorKey: 'is_main',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={translate('interlocutor.attributes.is_main')}
          />
        ),
        cell: ({ row }) => (
          <div>
            <Badge className="px-4 py-1">
              {row.original.firmsToInterlocutor?.find((firm) => firm.firmId === context.firmId)
                ?.isMain
                ? tCommon('answer.yes')
                : tCommon('answer.no')}
            </Badge>
          </div>
        ),
        enableSorting: false,
        enableHiding: true
      }
    );
  }

  columns.push({
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={translate('interlocutor.attributes.created_at')}
        attribute={INTERLOCUTOR_FILTER_ATTRIBUTES.CREATEDAT}
      />
    ),
    cell: ({ row }) => <div>{transformDateTime(row.original?.createdAt || '')}</div>,
    enableSorting: true,
    enableHiding: true
  });

  columns.push({
    id: 'actions',
    cell: ({ row }) => (
      <div className="flex justify-end">
        <DataTableRowActions row={row} />
      </div>
    )
  });

  return columns;
};
