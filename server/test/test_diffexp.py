import unittest
from server.data_common.matrix_loader import MatrixDataLoader
from server.test import PROJECT_ROOT, app_config
import server.compute.diffexp_cxg as diffexp_cxg
import server.compute.diffexp_generic as diffexp_generic
from server.converters.cxgtool import write_cxg
import numpy as np
import tempfile
import anndata
import os


class DiffExpTest(unittest.TestCase):
    """Tests the diffexp returns the expected results for one test case, using different
    adaptor types and different algorithms."""

    def load_dataset(self, path):
        config = app_config(path)
        loader = MatrixDataLoader(path)
        adaptor = loader.open(config)
        return adaptor

    def get_mask(self, adaptor, start, stride):
        """Simple function to return a mask or rows"""
        rows = adaptor.get_shape()[0]
        sel = list(range(start, rows, stride))
        mask = np.zeros(rows, dtype=bool)
        mask[sel] = True
        return mask

    def check_1_10_2_10(self, results):
        """Checks the results for a specific set of rows selections"""
        expects = [
            [956, 0.016060986, 0.0008649321884808977, 1.0],
            [1124, 0.96602094, 0.0011717216548271284, 1.0],
            [1809, 1.1110606, 0.0019304405196777848, 1.0],
            [1712, -0.5525154, 0.0051788902660723345, 1.0],
            [1754, 0.5201581, 0.005691734062127954, 1.0],
            [948, 1.6390722, 0.006622111055981219, 1.0],
            [1810, 0.78618884, 0.007055917428377063, 1.0],
            [779, 1.5241305, 0.007202934422407284, 1.0],
            [1575, 1.0317602, 0.007830310753043345, 1.0],
            [576, 0.97873515, 0.008272092578813124, 1.0],
        ]
        self.assertEqual(len(results), len(expects))
        for result, expect in zip(results, expects):
            self.assertEqual(result[0], expect[0])
            self.assertTrue(np.isclose(result[1], expect[1], 1e-6, 1e-6))
            self.assertTrue(np.isclose(result[2], expect[2], 1e-6, 1e-6))
            self.assertTrue(np.isclose(result[3], expect[3], 1e-6, 1e-6))

    def get_X_col(self, adaptor, cols):
        varmask = np.zeros(adaptor.get_shape()[1], dtype=bool)
        varmask[cols] = True
        return adaptor.get_X_array(None, varmask)

    def test_anndata_default(self):
        """Test an anndata adaptor with its default diffexp algorithm (diffexp_generic)"""
        adaptor = self.load_dataset(f"{PROJECT_ROOT}/example-dataset/pbmc3k.h5ad")
        maskA = self.get_mask(adaptor, 1, 10)
        maskB = self.get_mask(adaptor, 2, 10)
        results = adaptor.compute_diffexp_ttest(maskA, maskB, 10)
        self.check_1_10_2_10(results)

    def test_cxg_default(self):
        """Test a cxg adaptor with its default diffexp algorithm (diffexp_cxg)"""
        adaptor = self.load_dataset(f"{PROJECT_ROOT}/server/test/test_datasets/pbmc3k.cxg")
        maskA = self.get_mask(adaptor, 1, 10)
        maskB = self.get_mask(adaptor, 2, 10)

        # run it through the adaptor
        results = adaptor.compute_diffexp_ttest(maskA, maskB, 10)
        self.check_1_10_2_10(results)

        # run it directly
        results = diffexp_cxg.diffexp_ttest(adaptor, maskA, maskB, 10)
        self.check_1_10_2_10(results)

    def test_cxg_generic(self):
        """Test a cxg adaptor with the generic adaptor"""
        adaptor = self.load_dataset(f"{PROJECT_ROOT}/server/test/test_datasets/pbmc3k.cxg")
        maskA = self.get_mask(adaptor, 1, 10)
        maskB = self.get_mask(adaptor, 2, 10)
        # run it directly
        results = diffexp_generic.diffexp_ttest(adaptor, maskA, maskB, 10)
        self.check_1_10_2_10(results)

    def test_cxg_sparse(self):
        with tempfile.TemporaryDirectory() as dirname:
            sparsename = os.path.join(dirname, "sparse.cxg")
            densename = os.path.join(dirname, "dense.cxg")
            source_h5ad = anndata.read_h5ad(f"{PROJECT_ROOT}/example-dataset/pbmc3k.h5ad")
            # create a cxg sparse array
            write_cxg(adata=source_h5ad, container=sparsename, title="pbmc3k", sparse_threshold=100)
            write_cxg(adata=source_h5ad, container=densename, title="pbmc3k", sparse_threshold=0)
            adaptor_sparse = self.load_dataset(sparsename)
            adaptor_dense = self.load_dataset(densename)

            col_results = []
            for adaptor in (adaptor_sparse, adaptor_dense):
                maskA = self.get_mask(adaptor, 1, 10)
                maskB = self.get_mask(adaptor, 2, 10)
                diffexp_results = diffexp_cxg.diffexp_ttest(adaptor, maskA, maskB, 10)
                self.check_1_10_2_10(diffexp_results)
                topcols = [x[0] for x in diffexp_results]
                cols = self.get_X_col(adaptor, topcols)
                assert cols.shape[0] == adaptor.get_shape()[0]
                assert cols.shape[1] == len(diffexp_results)
                col_results.append(cols)

                x = adaptor.get_X_array()
                print(x)

        for row in range(col_results[0].shape[0]):
            for col in range(col_results[0].shape[1]):
                sval = col_results[0][row][col]
                dval = col_results[1][row][col]
                self.assertTrue(np.isclose(sval, dval, 1e-6, 1e-6))
