import { useRef } from 'react';
import { useRouter } from 'next/router';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';

// locale
import { useMessageContext } from '../common/message-context';
import client from '@/gql/apollo';
import { ProcessesDocument, useCreateProcessMutation } from '@/gql';
import { onError } from '@/utils';

import ProcessNew from './new';

const ProcessList: React.FC = () => {
  const router = useRouter();
  const { messageApi } = useMessageContext();

  const [createProcess] = useCreateProcessMutation({
    onCompleted: () => {
      messageApi?.success('创建成功');
      handleReloadTable();
    },
    onError,
  });

  const actionRef = useRef<ActionType | null>(null);

  const handleReloadTable = () => {
    actionRef.current?.reload();
  };

  const handleCreate = async (values: any) => {
    await createProcess({ variables: { request: values } });
  };

  const columns: ProColumns<any>[] = [
    {
      title: '名称',
      key: 'name',
      dataIndex: 'name',
    },
    {
      title: '创建时间',
      search: false,
      dataIndex: 'insertedAt',
      valueType: 'dateTime',
    },
  ];

  return (
    <ProTable
      actionRef={actionRef}
      columns={columns}
      request={async (params, sorter, filter) => {
        const { data } = await client.query({
          query: ProcessesDocument,
          variables: {
            request: {},
          },
        });

        return {
          data: data.processes,
          total: data.processes.length,
          success: true,
        };
      }}
      rowKey="uuid"
      pagination={{
        showQuickJumper: true,
      }}
      search={false}
      // search={{
      //   span: 6,
      //   layout: 'vertical',
      //   defaultCollapsed: true,
      // }}
      dateFormatter="string"
      toolBarRender={() => [<ProcessNew key="process-new" onCreate={(values: any) => handleCreate(values)} />]}
    />
  );
};

export default ProcessList;
