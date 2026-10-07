import { useState, useEffect, useCallback } from 'react';
import { workflowAPI } from '../services/api';

/**
 * Custom hook to manage single workflow state, polling, and lifecycle actions.
 *
 * @param {string} workflowId - ID of the workflow to observe
 * @param {object} options - Hook options (pollInterval, autoLoad)
 * @returns {object} - Workflow state and handler actions
 */
export function useWorkflow(workflowId, options = {}) {
  const { pollInterval = 0, autoLoad = true } = options;

  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchWorkflow = useCallback(async () => {
    if (!workflowId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await workflowAPI.getById(workflowId);
      setWorkflow(res.data.workflow || res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch workflow');
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  useEffect(() => {
    if (autoLoad && workflowId) {
      fetchWorkflow();
    }
  }, [workflowId, autoLoad, fetchWorkflow]);

  useEffect(() => {
    if (!pollInterval || !workflowId) return;
    const interval = setInterval(fetchWorkflow, pollInterval);
    return () => clearInterval(interval);
  }, [pollInterval, workflowId, fetchWorkflow]);

  const startWorkflow = async () => {
    try {
      setActionLoading(true);
      const res = await workflowAPI.start(workflowId);
      setWorkflow(res.data.workflow || res.data);
      return res.data;
    } finally {
      setActionLoading(false);
    }
  };

  const replanWorkflow = async () => {
    try {
      setActionLoading(true);
      const res = await workflowAPI.replan(workflowId);
      setWorkflow(res.data.workflow || res.data);
      return res.data;
    } finally {
      setActionLoading(false);
    }
  };

  const simulateFailure = async () => {
    try {
      setActionLoading(true);
      const res = await workflowAPI.simulateFailure(workflowId);
      setWorkflow(res.data.workflow || res.data);
      return res.data;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    workflow,
    loading,
    error,
    actionLoading,
    refresh: fetchWorkflow,
    startWorkflow,
    replanWorkflow,
    simulateFailure,
  };
}

export default useWorkflow;
