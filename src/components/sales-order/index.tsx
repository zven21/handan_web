import { useRef, useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Popconfirm, Tag, Button } from 'antd';
import size from 'lodash.size';

// locale
import { useMessageContext } from '@/components/common/message-context';
import client from '@/gql/apollo';
import {
  useCreateSalesOrderMutation,
  SalesOrdersDocument,
  useCreateDeliveryNoteMutation,
  useCreateSalesInvoiceMutation,
} from '@/gql';
import { onError } from '@/utils';
import { fetchCustomers } from '@/utils/api';

import SalesOrderNew from './new';
import SalesOrderDetail from './detail';
import SalesInvoiceNew from './invoice-new';

const SalesOrderList: React.FC = () => {
  const { messageApi } = useMessageContext();

  const [detailVisible, setDetailVisible] = useState(false);
  const [record, setRecord] = useState<any>(null);

  const [createSalesOrder] = useCreateSalesOrderMutation({
    onCompleted: () => {
      messageApi?.success('销售订单创建成功');
      handleReloadTable();
    },
    onError,
  });

  const [createDeliveryNote] = useCreateDeliveryNoteMutation({
    onCompleted: () => {
      messageApi?.success('出库凭证创建成功');
      handleReloadTable();
    },
    onError,
  });

  const [createSalesInvoice] = useCreateSalesInvoiceMutation({
    onCompleted: () => {
      messageApi?.success('收款凭证创建成功');
      handleReloadTable();
    },
    onError,
  });

  const actionRef = useRef<ActionType | null>(null);

  const handleReloadTable = () => {
    actionRef.current?.reload();
  };

  const handleCreate = async (values: any) => {
    await createSalesOrder({ variables: { request: values } });
  };

  const handleCreateDeliveryNote = async (values: any) => {
    const deliveryItems = values.items.map((item: any) => ({
      salesOrderItemUuid: item.uuid,
      actualQty: item.orderedQty,
    }));

    const request = {
      salesOrderUuid: values.uuid,
      deliveryItems,
    };

    await createDeliveryNote({ variables: { request } });
  };

  const handleCreateSalesInvoice = async (request: any) => {
    await createSalesInvoice({ variables: { request } });
  };

  const handleDetail = (record: any) => {
    setDetailVisible(true);
    setRecord(record);
  };

  const columns: ProColumns<any>[] = [
    {
      title: '单号',
      dataIndex: 'code',
      width: 100,
      render: (text, record) => (
        <Button type="link" onClick={() => handleDetail(record)}>
          {text}
        </Button>
      ),
    },
    {
      title: '客户名称',
      key: 'customerUuid',
      dataIndex: 'customerName',
      valueType: 'select',
      request: () => fetchCustomers({}),
    },
    {
      title: '状态',
      dataIndex: 'status',
    },
    {
      title: '发货状态',
      dataIndex: 'deliveryStatus',
    },
    {
      title: '支付状态',
      dataIndex: 'billingStatus',
    },
    {
      title: '仓库',
      dataIndex: 'warehouseName',
    },
    {
      title: '待支付/已支付/总额',
      dataIndex: 'totalAmount',
      search: false,
      width: 200,
      render: (item: any, record: any) => (
        <>
          <Tag color="red">{record.remainingAmount}</Tag>
          <Tag color="green">{record.paidAmount}</Tag>
          <Tag>{record.totalAmount}</Tag>
        </>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'insertedAt',
      valueType: 'dateTime',
    },
    {
      title: '操作',
      width: 180,
      key: 'option',
      valueType: 'option',
      render: (item: any, record: any) => [
        <>
          {record.status !== 'draft' && record.billingStatus != 'fully_billed' && (
            <SalesInvoiceNew key="sales-invoice-new" record={record} onCallback={handleCreateSalesInvoice} />
          )}
        </>,
        <>
          {record.status !== 'draft' && record.deliveryStatus != 'fully_delivered' && (
            <Popconfirm
              key="link2"
              title="确定出库吗？"
              onConfirm={() => handleCreateDeliveryNote(record)}
              okText="是"
              cancelText="否"
            >
              <Button size="small" type="link">
                添加出库凭证
              </Button>
            </Popconfirm>
          )}
        </>,
      ],
    },
  ];

  return (
    <>
      <ProTable
        actionRef={actionRef}
        columns={columns}
        request={async (params, sorter, filter) => {
          const { data } = await client.query({
            query: SalesOrdersDocument,
            variables: {
              request: {},
            },
          });

          return {
            data: data.salesOrders,
            total: size(data.salesOrders),
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
        toolBarRender={() => [<SalesOrderNew key="sales-order-new" onCreate={(values: any) => handleCreate(values)} />]}
      />

      <SalesOrderDetail
        uuid={record?.uuid}
        visible={detailVisible}
        record={record}
        onClose={() => setDetailVisible(false)}
      />
    </>
  );
};

export default SalesOrderList;
