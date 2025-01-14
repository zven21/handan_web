import { useRef } from 'react';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';

// locale
import { useMessageContext } from '@/components/common/message-context';
import client from '@/gql/apollo';
import { WorkOrdersDocument, useCreateWorkOrderMutation } from '@/gql';
import { onError } from '@/utils';

import WorkOrderNew from './new';

const WorkOrderList: React.FC = () => {
  const { messageApi } = useMessageContext();

  const [createWorkOrder] = useCreateWorkOrderMutation({
    onCompleted: () => {
      messageApi?.success('创建工单成功');
      handleReloadTable();
    },
    onError,
  });

  const actionRef = useRef<ActionType | null>(null);

  const handleReloadTable = () => {
    actionRef.current?.reload();
  };

  const handleCreate = async (values: any) => {
    await createWorkOrder({ variables: { request: values } });
  };

  const columns: ProColumns<any>[] = [
    {
      title: '产品名称',
      key: 'itemName',
      width: 200,
      dataIndex: 'itemName',
    },
    {
      title: 'plannedQty',
      dataIndex: 'plannedQty',
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      valueType: 'date',
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      valueType: 'date',
    },
  ];

  return (
    <ProTable
      actionRef={actionRef}
      columns={columns}
      request={async (params, sorter, filter) => {
        const { data } = await client.query({
          query: WorkOrdersDocument,
          variables: {
            request: {},
          },
        });

        return {
          data: data.workOrders,
          total: data.workOrders.length,
          success: true,
        };
      }}
      rowKey="uuid"
      pagination={{
        showQuickJumper: true,
      }}
      search={false}
      // search={{
      //   layout: 'vertical',
      //   defaultCollapsed: true,
      // }}
      dateFormatter="string"
      toolBarRender={() => [<WorkOrderNew key="work-order-new" onCreate={(values: any) => handleCreate(values)} />]}
    />
  );
};

export default WorkOrderList;
